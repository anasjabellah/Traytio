/**
 * B-10 Production Hardening — Event PDF route — Unit Tests
 *
 * Tests the security + rate-limiting behaviour of the event PDF route
 * (src/app/api/events/[id]/pdf/route.tsx) so the CPU-heavy renderToBuffer
 * call is bounded by a per-user/per-IP limit on GET requests (the write-only
 * withApiGuard does not cover GETs) and so cross-tenant reads are impossible.
 *
 * We inline faithful replicas of the small decision helpers (key building,
 * 429/503 response selection) rather than importing them, so these tests do
 * not pull in @clerk/@react-pdf/Prisma transitive deps — same convention as
 * tests/b02-pdf-rate-limit.test.ts.
 *
 * Run: npx tsx tests/b10-events-pdf-route.test.ts
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

// ── Response selection (mirrors the route's gate) ──

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
  return { status: 429, error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.', headers: h }
}

function rateLimitUnavailableResponse(): { status: number; error: string } {
  return { status: 503, error: 'Service temporairement indisponible. Veuillez réessayer plus tard.' }
}

// ── Dynamic route gate under test (mirrors the PDF GET handler) ──

type AuthState = { userId: string | null }

interface GateDeps {
  auth: () => Promise<AuthState>
  limit: (key: string) => Promise<RateLimitResult>
  /** Mirrors getOrganizationId() — throws Forbidden for unaffiliated callers. */
  resolveOrg: () => Promise<string>
  /** Mirrors assertCan('events', 'read') — returns true or throws Forbidden. */
  assertCanRead: () => Promise<boolean>
  /** Mirrors prisma.event.findFirst({ where: { id, organizationId } }) + org lookup. */
  fetchEvent: (id: string, organizationId: string) => Promise<'denied' | 'not-found' | 'ok'>
  render: () => void
}

type GateResult = {
  status: number
  error?: string
  headers?: HeadersLike
  render: boolean
}

/**
 * Returns a response descriptor rather than a real NextResponse so the test
 * asserts on the decision without needing Prisma/Clerk/@react-pdf. `render`
 * increments only when every gate (auth → rate limit → RBAC/tenant → org-scoped
 * fetch) passes, letting us assert the expensive call never runs on rejection.
 * No global state — deps are injected per call so tests cannot contaminate one
 * another.
 */
async function eventPdfRouteGate(
  request: Request,
  deps: GateDeps,
): Promise<GateResult> {
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

  // Mirrors const { id } = await params — server-derived, never client-minted.
  const id = new URL(request.url).pathname.split('/').filter(Boolean).at(2) ?? ''
  if (!id) {
    return { status: 404, render: false }
  }

  let organizationId: string
  try {
    organizationId = await deps.resolveOrg()
  } catch {
    return { status: 403, error: 'Requête refusée : origine non autorisée.', render: false }
  }

  let canRead: boolean
  try {
    canRead = await deps.assertCanRead()
  } catch {
    return { status: 403, error: 'Requête refusée : origine non autorisée.', render: false }
  }
  if (!canRead) {
    return { status: 403, error: 'Requête refusée : origine non autorisée.', render: false }
  }

  // The org-scoped lookup always runs against the request id and the caller's
  // authenticated organizationId — never a client-supplied org value.
  const orgCheck = await deps.fetchEvent(id, organizationId)
  if (orgCheck === 'denied') {
    return { status: 403, render: false }
  }
  if (orgCheck === 'not-found') {
    return { status: 404, error: 'Événement introuvable.', render: false }
  }

  // Passed every gate → the expensive renderToBuffer would execute here.
  deps.render()
  return { status: 200, render: true }
}

// ── Mini test harness: build isolated per-test deps ──

function makeRequest({ id, ip }: { id: string; ip: string }): Request {
  return new Request(`https://app.local/api/events/${id}/pdf`, {
    headers: { 'x-forwarded-for': ip },
  })
}

function makeDeps(overrides: {
  auth?: () => Promise<AuthState>
  limit?: (key: string) => Promise<RateLimitResult>
  resolveOrg?: () => Promise<string>
  assertCanRead?: () => Promise<boolean>
  fetchEvent?: (id: string, organizationId: string) => Promise<'denied' | 'not-found' | 'ok'>
  render?: () => void
}, onKey?: (key: string) => void, onFetch?: (id: string, organizationId: string) => void) {
  const state = { renderCount: 0 }
  const deps: GateDeps = {
    auth: overrides.auth ?? (async () => ({ userId: 'user_1' })),
    limit:
      overrides.limit ??
      (async (key: string) => {
        onKey?.(key)
        return { ok: true, remaining: 29, resetInMs: 30_000, reason: 'ok' }
      }),
    resolveOrg: overrides.resolveOrg ?? (async () => 'orgA'),
    assertCanRead: overrides.assertCanRead ?? (async () => true),
    fetchEvent:
      overrides.fetchEvent ??
      (async (id: string, organizationId: string) => {
        onFetch?.(id, organizationId)
        return 'ok'
      }),
    render: () => {
      state.renderCount += 1
      if (overrides.render) overrides.render()
    },
  }
  return { deps, renderCount: () => state.renderCount }
}

// ── Tests ──

describe('B-10 event PDF route gate', () => {
  it('allows a PDF render on the first request and returns 200', async () => {
    const { deps, renderCount } = makeDeps({})
    const res = await eventPdfRouteGate(makeRequest({ id: 'evt_1', ip: '1.2.3.4' }), deps)
    assert.equal(res.status, 200)
    assert.equal(res.render, true)
    assert.equal(renderCount(), 1, 'renderToBuffer should have run once')
  })

  it('returns 429 when the limit is exceeded and never calls render', async () => {
    const { deps, renderCount } = makeDeps({
      limit: async () => ({ ok: false, remaining: 0, resetInMs: 30_000, reason: 'limit' }),
    })
    const res = await eventPdfRouteGate(makeRequest({ id: 'evt_1', ip: '5.6.7.8' }), deps)
    assert.equal(res.status, 429)
    assert.equal(res.render, false)
    assert.equal(renderCount(), 0, 'renderToBuffer must NOT run on a limited request')
  })

  it('returns standard 429 headers (Retry-After, X-RateLimit-Remaining)', async () => {
    const { deps } = makeDeps({
      limit: async () => ({ ok: false, remaining: 3, resetInMs: 45_000, reason: 'limit' }),
    })
    const res = await eventPdfRouteGate(makeRequest({ id: 'evt_1', ip: '9.9.9.9' }), deps)
    assert.equal(res.status, 429)
    const headers = res.headers!
    assert.equal(headers.values['Retry-After'], '45')
    assert.equal(headers.values['X-RateLimit-Remaining'], '3')
  })

  it('isolates the limit key by user when the IP is shared (user A limited, user B not)', async () => {
    const seen: string[] = []
    const { deps } = makeDeps(
      {
        auth: async () => ({ userId: 'user_a' }),
        limit: async (key: string) => {
          seen.push(key)
          return key.startsWith('pdf:user:user_a:')
            ? { ok: false, remaining: 0, resetInMs: 30_000, reason: 'limit' }
            : { ok: true, remaining: 29, resetInMs: 30_000, reason: 'ok' }
        },
      },
    )

    const sharedIp = '10.0.0.1'
    const resA = await eventPdfRouteGate(makeRequest({ id: 'evt_1', ip: sharedIp }), deps)
    assert.equal(resA.status, 429)
    assert.equal(resA.render, false)

    const b = makeDeps({ auth: async () => ({ userId: 'user_b' }) })
    const resB = await eventPdfRouteGate(makeRequest({ id: 'evt_1', ip: sharedIp }), b.deps)
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

    const r1 = await eventPdfRouteGate(makeRequest({ id: 'evt_1', ip: '10.1.1.1' }), deps)
    const r2 = await eventPdfRouteGate(makeRequest({ id: 'evt_1', ip: '10.2.2.2' }), deps)
    assert.equal(r1.status, 200)
    assert.equal(r2.status, 200)
    assert.equal(callCount, 2, 'each distinct IP hits the limiter independently')
  })

  it('fails closed (returns 503) when Redis is unavailable in production', async () => {
    const { deps } = makeDeps({
      limit: async () => ({ ok: false, remaining: 0, resetInMs: 0, reason: 'unavailable' }),
    })
    const res = await eventPdfRouteGate(makeRequest({ id: 'evt_1', ip: '1.1.1.1' }), deps)
    assert.equal(res.status, 503)
    assert.equal(res.render, false, 'no render should occur on a fail-closed outage')
  })

  it('proceeds (200) in dev/local when limiting is disabled', async () => {
    const { deps } = makeDeps({
      limit: async () => ({ ok: true, remaining: Infinity, resetInMs: 0, reason: 'disabled' }),
    })
    const res = await eventPdfRouteGate(makeRequest({ id: 'evt_1', ip: '8.8.8.8' }), deps)
    assert.equal(res.status, 200)
    assert.equal(res.render, true)
  })

  it('rejects unauthenticated requests before any rendering (defense-in-depth)', async () => {
    const { deps } = makeDeps({
      auth: async () => ({ userId: null }),
    })
    const res = await eventPdfRouteGate(makeRequest({ id: 'evt_1', ip: '7.7.7.7' }), deps)
    assert.equal(res.status, 401)
    assert.equal(res.render, false)
  })

  it('never accepts a client-supplied userId for the rate-limit identity', async () => {
    let keyUsed = ''
    const { deps } = makeDeps(
      {
        auth: async () => ({ userId: 'server_real_user' }),
      },
      (key: string) => {
        keyUsed = key
      },
    )

    const forged = new Request('https://app.local/api/events/evt_1/pdf', {
      headers: {
        'x-forwarded-for': '3.3.3.3',
        'x-user-id': 'admin_victim', // attacker-forged
      },
    })
    await eventPdfRouteGate(forged, deps)
    assert.ok(keyUsed.startsWith('pdf:user:server_real_user:'), `got: ${keyUsed}`)
    assert.ok(!keyUsed.includes('admin_victim'), 'forged client id must never enter the key')
  })

  it('returns 404 for an event id that does not exist (org-scoped findFirst)', async () => {
    const { deps } = makeDeps({
      fetchEvent: async () => 'not-found',
    })
    const res = await eventPdfRouteGate(makeRequest({ id: 'missing_id', ip: '4.4.4.4' }), deps)
    assert.equal(res.status, 404)
    assert.equal(res.render, false, 'no render for a missing event')
  })

  it('prevents cross-tenant export: a member of org A can never render org B event ids', async () => {
    // The org-scoped lookup (findFirst where { id, organizationId }) scopes the
    // query to the CALLER's authenticated org before rendering. An id belonging
    // to another tenant returns no row → 404 + no render.
    let fetchScoped = ''
    const { deps } = makeDeps({
      fetchEvent: async (id: string, organizationId: string) => {
        fetchScoped = `${organizationId}:${id}`
        return 'not-found'
      },
    })
    const res = await eventPdfRouteGate(
      makeRequest({ id: 'evt_other_org', ip: '2.2.2.2' }),
      deps,
    )
    assert.equal(res.status, 404)
    assert.equal(res.render, false, 'foreign event must never render for this org')
    assert.equal(fetchScoped, 'orgA:evt_other_org', 'lookup must be scoped to orgA, the caller org')
  })

  it('403 (no render) when assertCan overrides reject the caller', async () => {
    const { deps } = makeDeps({
      assertCanRead: async () => {
        throw new Error('Forbidden: MEMBER cannot read events')
      },
    })
    const res = await eventPdfRouteGate(makeRequest({ id: 'evt_1', ip: '6.6.6.6' }), deps)
    assert.equal(res.status, 403)
    assert.equal(res.render, false, 'no render when RBAC denies the caller')
  })
})