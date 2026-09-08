/**
 * B-03 Security — Anonymous action rate limiting — Unit Tests
 *
 * Verifies the fix in src/lib/action-guard.ts: anonymous requests to public
 * server actions are now keyed per client IP (`anon:{ip}:{action}`) instead of
 * a single global bucket (`anon:{action}`), so one attacker cannot exhaust the
 * shared bucket and 429 every legitimate anonymous user.
 *
 * We inline faithful replicas of the guard's decision core + the shared
 * getClientIp helper rather than importing them, so these tests do not pull in
 * @clerk/@react-pdf/Prisma transitive deps — same convention as
 * tests/b02-pdf-rate-limit.test.ts.
 *
 * Run: npx tsx tests/b03-action-anon-rate-limit.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ── IP extraction (faithful replica of src/lib/ip.ts, shared by api-guard) ──

interface HeaderLookup {
  get(name: string): string | null
}

function getClientIp(headers: HeaderLookup): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim()
    if (ip) return ip
  }
  return headers.get('x-real-ip')?.trim() || 'unknown'
}

// ── Guard decision core (faithful replica of src/lib/action-guard.ts) ──

type GateResult =
  | { gate: 'unauthorized' }
  | { gate: 'forbidden' }
  | { gate: 'limited' }
  | { gate: 'ok' }

async function actionGate(
  input: {
    userId: string | null
    publicAction: boolean
    write: boolean
    name: string
  },
  deps: {
    sameOrigin: () => Promise<boolean>
    getHeaders: () => Promise<HeaderLookup>
    limit: (key: string) => Promise<{ ok: boolean }>
    run: () => void
  },
): Promise<{ result: GateResult; key: string | null }> {
  const { userId, publicAction, write, name } = input

  // Gate 1: authentication (unchanged) — block anonymous unless explicitly public.
  if (!userId && !publicAction) {
    return { result: { gate: 'unauthorized' }, key: null }
  }

  // Gate 2: CSRF (unchanged) — writes only.
  if (write && !(await deps.sameOrigin())) {
    return { result: { gate: 'forbidden' }, key: null }
  }

  // Gate 3: rate limiting — authenticated per userId, anonymous per client IP.
  const key = userId ? `${userId}:${name}` : `anon:${getClientIp(await deps.getHeaders())}:${name}`

  const limit = await deps.limit(key)
  if (!limit.ok) {
    return { result: { gate: 'limited' }, key }
  }

  deps.run()
  return { result: { gate: 'ok' }, key }
}

// ── Test harness: isolated per-test deps ──

function makeHeaders(headers: Record<string, string> = {}): HeaderLookup {
  return { get: (name: string) => headers[name.toLowerCase()] ?? null }
}

function makeGate(overrides: {
  userId?: string | null
  publicAction?: boolean
  write?: boolean
  name?: string
  sameOrigin?: boolean
  headers?: Record<string, string>
  limit?: (key: string) => boolean
  run?: () => void
} = {}) {
  const keys: string[] = []
  const calls = { limit: 0, run: 0, getHeaders: 0 }

  const input = {
    userId: overrides.userId === undefined ? null : overrides.userId,
    publicAction: overrides.publicAction ?? false,
    write: overrides.write ?? true,
    name: overrides.name ?? 'contact:create',
  }

  const deps = {
    sameOrigin: async () => overrides.sameOrigin ?? true,
    getHeaders: async () => {
      calls.getHeaders += 1
      return makeHeaders(overrides.headers ?? {})
    },
    limit: async (key: string) => {
      calls.limit += 1
      keys.push(key)
      return { ok: overrides.limit ? overrides.limit(key) : true }
    },
    run: () => {
      calls.run += 1
      overrides.run?.()
    },
  }

  return {
    gate: () => actionGate(input, deps),
    keys,
    calls,
  }
}

// ── Tests ──

describe('B-03 anonymous rate limiting (action-guard)', () => {
  it('keys anonymous actions as anon:{ip}:{action name}', async () => {
    const g = makeGate({ publicAction: true, headers: { 'x-forwarded-for': '1.2.3.4' } })
    const res = await g.gate()
    assert.equal(res.result.gate, 'ok')
    assert.equal(g.keys[0], 'anon:1.2.3.4:contact:create')
  })

  it('two different anonymous IPs have independent buckets', async () => {
    const gA = makeGate({ publicAction: true, headers: { 'x-forwarded-for': '10.0.0.1' } })
    const gB = makeGate({ publicAction: true, headers: { 'x-forwarded-for': '10.0.0.2' } })
    const [rA, rB] = await Promise.all([gA.gate(), gB.gate()])
    assert.equal(rA.result.gate, 'ok')
    assert.equal(rB.result.gate, 'ok')
    assert.notEqual(gA.keys[0], gB.keys[0], 'distinct IPs must not share a bucket key')

    // Attacker exhausts IP 10.0.0.1's bucket — a different IP stays unaffected.
    const denyBucketA = (key: string) => !key.includes('10.0.0.1')
    const limited = makeGate({
      publicAction: true,
      headers: { 'x-forwarded-for': '10.0.0.1' },
      limit: denyBucketA,
    })
    assert.equal((await limited.gate()).result.gate, 'limited')

    const allowed = makeGate({
      publicAction: true,
      headers: { 'x-forwarded-for': '10.0.0.2' },
      limit: denyBucketA,
    })
    assert.equal((await allowed.gate()).result.gate, 'ok')
  })

  it('the same anonymous IP shares the same bucket key', async () => {
    const g1 = makeGate({ publicAction: true, headers: { 'x-forwarded-for': '8.8.8.8' } })
    const g2 = makeGate({ publicAction: true, headers: { 'x-forwarded-for': '8.8.8.8' } })
    await g1.gate()
    await g2.gate()
    assert.equal(g1.keys[0], 'anon:8.8.8.8:contact:create')
    assert.equal(g2.keys[0], g1.keys[0], 'same IP must map to the same bucket key')
  })

  it('uses the first hop of a comma-separated x-forwarded-for chain', async () => {
    const g = makeGate({
      publicAction: true,
      headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.2, 10.0.0.1' },
    })
    await g.gate()
    assert.equal(g.keys[0], 'anon:203.0.113.1:contact:create')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', async () => {
    const g = makeGate({ publicAction: true, headers: { 'x-real-ip': '198.51.100.7' } })
    await g.gate()
    assert.equal(g.keys[0], 'anon:198.51.100.7:contact:create')
  })

  it('falls back to "unknown" when no IP headers are present', async () => {
    const g = makeGate({ publicAction: true, headers: {} })
    await g.gate()
    assert.equal(g.keys[0], 'anon:unknown:contact:create')
  })

  it('authenticated users keep userId-based keys (no anon, no IP)', async () => {
    const g = makeGate({
      userId: 'user_123',
      headers: { 'x-forwarded-for': '9.9.9.9' },
    })
    const res = await g.gate()
    assert.equal(res.result.gate, 'ok')
    assert.equal(g.keys[0], 'user_123:contact:create')
    assert.ok(!g.keys[0].startsWith('anon:'), 'authenticated keys must not be anon')
    assert.ok(!g.keys[0].includes('9.9.9.9'), 'authenticated keys must not include the client IP')
    assert.equal(g.calls.getHeaders, 0, 'headers() must not be read for authenticated requests')
  })

  it('authentication gate unchanged: anonymous non-public action is rejected before rate limiting', async () => {
    const g = makeGate({ publicAction: false })
    const res = await g.gate()
    assert.equal(res.result.gate, 'unauthorized')
    assert.equal(g.calls.limit, 0, 'limiter must not be consulted for unauthorized callers')
    assert.equal(g.calls.run, 0, 'wrapped action must not run')
    assert.equal(g.calls.getHeaders, 0, 'headers() must not be read when auth rejects')
  })

  it('CSRF gate unchanged: cross-origin write is rejected before rate limiting', async () => {
    const g = makeGate({ publicAction: true, write: true, sameOrigin: false })
    const res = await g.gate()
    assert.equal(res.result.gate, 'forbidden')
    assert.equal(g.calls.limit, 0, 'limiter must not be consulted for a forbidden write')
    assert.equal(g.calls.run, 0, 'wrapped action must not run')
  })

  it('public read actions skip CSRF but are still rate-limited by IP', async () => {
    // get-invitation-by-token (team:read) is a public read: CSRF is skipped,
    // yet anonymous callers are still keyed per IP.
    const g = makeGate({
      publicAction: true,
      write: false,
      name: 'team:read',
      sameOrigin: false, // would reject if CSRF were consulted
      headers: { 'x-forwarded-for': '5.5.5.5' },
    })
    const res = await g.gate()
    assert.equal(res.result.gate, 'ok', 'reads skip the CSRF gate')
    assert.equal(g.keys[0], 'anon:5.5.5.5:team:read')

    const limited = makeGate({
      publicAction: true,
      write: false,
      name: 'team:read',
      headers: { 'x-forwarded-for': '5.5.5.5' },
      limit: () => false,
    })
    assert.equal((await limited.gate()).result.gate, 'limited', 'anon reads are still rate-limited')
  })

  it('public write actions still pass the CSRF gate before reaching the limiter', async () => {
    const g = makeGate({ publicAction: true, write: true, sameOrigin: false })
    const res = await g.gate()
    assert.equal(res.result.gate, 'forbidden')
    assert.equal(g.calls.limit, 0)
  })

  it('rate limiting still applies to anonymous writes when under quota / over quota', async () => {
    const allowed = makeGate({ publicAction: true, headers: { 'x-forwarded-for': '7.7.7.7' } })
    assert.equal((await allowed.gate()).result.gate, 'ok')
    assert.equal(allowed.calls.run, 1, 'wrapped action runs when allowed')

    const limited = makeGate({
      publicAction: true,
      headers: { 'x-forwarded-for': '7.7.7.7' },
      limit: () => false,
    })
    const res = await limited.gate()
    assert.equal(res.result.gate, 'limited')
    assert.equal(limited.calls.run, 0, 'wrapped action must not run when limited')
  })
})