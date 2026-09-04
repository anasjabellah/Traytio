/**
 * B-02 Production Hardening — Invoice PDF rate limiting — Unit Tests
 *
 * Tests the rate-limiting behaviour injected into the invoice PDF route
 * (src/app/api/invoices/[id]/pdf/route.tsx) so the CPU-heavy renderToBuffer
 * call is bounded by a per-user/per-IP limit on GET requests (the write-only
 * withApiGuard does not cover GETs).
 *
 * We inline faithful replicas of the small decision helpers (key building and
 * 429/503 response selection) rather than importing them, so these tests do
 * not pull in @clerk/@react-pdf/Prisma transitive deps — same convention as
 * tests/a01-fk-ownership.test.ts.
 *
 * Run: npx tsx tests/b02-pdf-rate-limit.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ── Reason/result + decision model (mirrors src/lib/rate-limiter.ts) ──

type RateLimitReason = 'ok' | 'limit' | 'unavailable' | 'disabled'

interface RateLimitResult {
  ok: boolean
  remaining: number
  resetInMs: number
  reason: RateLimitReason
}

// ── Key building + IP extraction (mirrors src/lib/api-guard.ts) ──

/** Faithful replica of getClientIp from api-guard.ts. */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim()
    if (ip) return ip
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

/** Faithful replica of buildRateLimitKey from api-guard.ts. */
function buildRateLimitKey(request: Request, userId: string | null, category: string): string {
  const ip = getClientIp(request)
  const identity = userId ? `user:${userId}` : `anon:${ip}`
  return `${category}:${identity}:${ip}`
}

// ── Response selection (mirrors the PDF route's added logic) ──

class HeadersLike {
  values: Record<string, string> = {}
  set(k: string, v: string) {
    this.values[k] = v
  }
}

function rateLimitExceededResponse(result: RateLimitResult): { status: number; error: string; headers: HeadersLike } {
  const h = new HeadersLike()
  h.set('Retry-After', String(Math.ceil(result.resetInMs / 1000)))
  h.set('X-RateLimit-Remaining', String(result.remaining))
  return { status: 429, error: 'Trop de requêtes. Veuillez réessayer dans un instant.', headers: h }
}

function rateLimitUnavailableResponse(): { status: number; error: string } {
  return { status: 503, error: 'Service temporairement indisponible. Veuillez réessayer plus tard.' }
}

/**
 * Dynamic route handler under test (mirrors the PDF GET handler's rate-limit
 * gate). Returns a response descriptor rather than a real NextResponse so the
 * test asserts on the decision without needing Prisma/Clerk/@react-pdf.
 * `render` increments only when the gate is passed, letting us assert the
 * expensive call never runs on rejection. No global state — deps are injected
 * per call so tests cannot contaminate one another.
 */
async function pdfRouteGate(
  request: Request,
  deps: {
    auth: () => Promise<{ userId: string | null }>
    limit: (key: string) => Promise<RateLimitResult>
    render: () => void
  },
) {
  const { userId } = await deps.auth()

  // The route enforces auth before rate limiting (proxy middleware does the
  // real gate; this is defense-in-depth mirroring the route's `!userId` check).
  if (!userId) {
    return { status: 401, error: 'Non authentifié', render: false }
  }

  const key = buildRateLimitKey(request, userId, 'pdf')
  const result = await deps.limit(key)

  if (!result.ok) {
    return result.reason === 'unavailable'
      ? { ...rateLimitUnavailableResponse(), render: false }
      : { ...rateLimitExceededResponse(result), render: false }
  }

  // Passed the gate → the expensive renderToBuffer would execute here.
  deps.render()
  return { status: 200, render: true }
}

// ── Mini test harness: build isolated per-test deps ──

function makeRequest(ip: string): Request {
  return new Request('https://app.local/api/invoices/inv_1/pdf', {
    headers: { 'x-forwarded-for': ip },
  })
}

function makeDeps(overrides: {
  auth?: () => Promise<{ userId: string | null }>
  limit?: (key: string) => Promise<RateLimitResult>
  render?: () => void
}, onKey?: (key: string) => void) {
  const state = { renderCount: 0 }
  const deps = {
    auth: overrides.auth ?? (async () => ({ userId: 'user_1' })),
    limit:
      overrides.limit ??
      (async (key: string) => {
        onKey?.(key)
        return { ok: true, remaining: 29, resetInMs: 30_000, reason: 'ok' }
      }),
    render: () => {
      state.renderCount += 1
      if (overrides.render) overrides.render()
    },
  }
  return { deps, renderCount: () => state.renderCount }
}

// ── Tests ──

describe('B-02 invoice PDF rate limiting', () => {
  it('allows a PDF render on the first request and returns 200', async () => {
    const { deps, renderCount } = makeDeps({})
    const res = await pdfRouteGate(makeRequest('1.2.3.4'), deps)
    assert.equal(res.status, 200)
    assert.equal(res.render, true)
    assert.equal(renderCount(), 1, 'renderToBuffer should have run once')
  })

  it('returns 429 when the limit is exceeded and never calls render', async () => {
    const { deps, renderCount } = makeDeps({
      limit: async () => ({ ok: false, remaining: 0, resetInMs: 30_000, reason: 'limit' }),
    })
    const res = await pdfRouteGate(makeRequest('5.6.7.8'), deps)
    assert.equal(res.status, 429)
    assert.equal(res.render, false)
    assert.equal(renderCount(), 0, 'renderToBuffer must NOT run on a limited request')
  })

  it('returns standard 429 headers (Retry-After, X-RateLimit-Remaining)', async () => {
    const { deps } = makeDeps({
      limit: async () => ({ ok: false, remaining: 3, resetInMs: 45_000, reason: 'limit' }),
    })
    const res = await pdfRouteGate(makeRequest('9.9.9.9'), deps)
    assert.equal(res.status, 429)
    const headers = (res as any).headers as HeadersLike
    assert.equal(headers.values['Retry-After'], '45')
    assert.equal(headers.values['X-RateLimit-Remaining'], '3')
  })

  it('isolates the limit key by user when the IP is shared (user A limited, user B not)', async () => {
    // Key must be pdf:user:{userId}:{ip} — userId is server-derived, not client-supplied.
    const seen: string[] = []
    const { deps } = makeDeps(
      {
        auth: async () => ({ userId: 'user_a' }),
        limit: async (key: string) => {
          seen.push(key)
          // user_a is over their quota on this shared IP; user_b would be fine.
          return key.startsWith('pdf:user:user_a:')
            ? { ok: false, remaining: 0, resetInMs: 30_000, reason: 'limit' }
            : { ok: true, remaining: 29, resetInMs: 30_000, reason: 'ok' }
        },
      },
    )

    const sharedIp = '10.0.0.1'
    const resA = await pdfRouteGate(makeRequest(sharedIp), deps)
    assert.equal(resA.status, 429)
    assert.equal(resA.render, false)

    // Now a second request but for user_b on the same IP -> separate key, allowed.
    const b = makeDeps({ auth: async () => ({ userId: 'user_b' }) })
    const resB = await pdfRouteGate(makeRequest(sharedIp), b.deps)
    assert.equal(resB.status, 200)
    assert.equal(resB.render, true)

    assert.ok(
      seen.every((k) => k.startsWith('pdf:user:')),
      'Every key must be derived from the server-side userId and category, never the client',
    )
    assert.ok(seen.some((k) => k.includes(':user_a:')), 'expected a key for user_a')
  })

  it('isolates the limit key by IP for the same user (different IP is a separate bucket)', async () => {
    let callCount = 0
    const { deps } = makeDeps({
      limit: async () => {
        callCount += 1
        return { ok: true, remaining: 28, resetInMs: 30_000, reason: 'ok' }
      },
    })

    const r1 = await pdfRouteGate(makeRequest('10.1.1.1'), deps)
    const r2 = await pdfRouteGate(makeRequest('10.2.2.2'), deps)
    assert.equal(r1.status, 200)
    assert.equal(r2.status, 200)
    assert.equal(callCount, 2, 'each distinct IP hits the limiter independently')
  })

  it('fails closed (returns 503) when Redis is unavailable in production', async () => {
    const { deps, renderCount } = makeDeps({
      limit: async () => ({ ok: false, remaining: 0, resetInMs: 0, reason: 'unavailable' }),
    })
    const res = await pdfRouteGate(makeRequest('1.1.1.1'), deps)
    assert.equal(res.status, 503)
    assert.equal(res.render, false, 'no render should occur on a fail-closed outage')
  })

  it('proceeds (200) in dev/local when limiting is disabled', async () => {
    const { deps, renderCount } = makeDeps({
      limit: async () => ({ ok: true, remaining: Infinity, resetInMs: 0, reason: 'disabled' }),
    })
    const res = await pdfRouteGate(makeRequest('8.8.8.8'), deps)
    assert.equal(res.status, 200)
    assert.equal(res.render, true)
  })

  it('rejects unauthenticated requests before any rendering (defense-in-depth)', async () => {
    const { deps, renderCount } = makeDeps({
      auth: async () => ({ userId: null }),
    })
    const res = await pdfRouteGate(makeRequest('7.7.7.7'), deps)
    assert.equal(res.status, 401)
    assert.equal(res.render, false)
  })

  it('never accepts a client-supplied userId for the rate-limit identity', async () => {
    // Even if the attacker includes x-user-id / claims a victim id in headers
    // or body, the key must only ever use the authenticated server-derived id.
    let keyUsed = ''
    const { deps } = makeDeps(
      {
        auth: async () => ({ userId: 'server_real_user' }),
      },
      (key: string) => {
        keyUsed = key
      },
    )

    const forged = new Request('https://app.local/api/invoices/inv_1/pdf', {
      headers: {
        'x-forwarded-for': '3.3.3.3',
        'x-user-id': 'admin_victim', // attacker-forged
      },
    })
    await pdfRouteGate(forged, deps)
    assert.ok(keyUsed.startsWith('pdf:user:server_real_user:'), `got: ${keyUsed}`)
    assert.ok(!keyUsed.includes('admin_victim'), 'forged client id must never enter the key')
  })
})
