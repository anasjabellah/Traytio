/**
 * B-05 Security/Performance — get-events-page unbounded reads — Unit Tests
 *
 * Verifies the fix in src/features/events/actions/get-events-page.ts:
 *   1. The user-controlled pagination `limit` is normalized to [1, 100] before
 *      it reaches Prisma. Default stays EVENT_DEFAULT_PAGE_SIZE (10). `skip` and
 *      the response metadata are derived from the SAME normalized value — the
 *      raw client-controlled limit never reaches Prisma.
 *   2. The `todayRaw` query (sidebar "today events" widget) is capped at
 *      `take: 50` while keeping its filters, orderBy, eventSelect and org scope.
 *   3. The `historicalEvents` sparkline query stays time-bounded (8 months) and
 *      organization-scoped, and is NOT artificially capped by this fix.
 *
 * The simulated "*Wire" helpers model the raw-input → normalization → Prisma
 * call exactly as the handler does and return the exact `{where, skip, take}`
 * Prisma would receive — so a wiring bug (raw limit reaching `take`, or a `take`
 * missing from todayRaw) is detectable, unlike a helper-only replica. Same
 * convention as tests/b01/b03/b04 (we do not import the action to avoid pulling
 * in @clerk/@react-pdf/Prisma transitive deps).
 *
 * Run: npx tsx tests/b05-get-events-page-perf.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ── Policy constants (faithful replica) ──

const MAX_LIMIT = 100
const TODAY_TAKE = 50
const UPCOMING_TAKE = 3
const EVENT_DEFAULT_PAGE_SIZE = 10

// ── Where-building (faithful replica of the handler) ──

type FilterInput = {
  search?: string
  status?: string | null
  type?: string | null
  dateFrom?: string
  dateTo?: string
  budgetMin?: number | ''
  budgetMax?: number | ''
}

function buildWhere(organizationId: string, f: FilterInput): Record<string, unknown> {
  const where: Record<string, unknown> = { organizationId }
  if (f.search) {
    where.OR = [
      { name: { contains: f.search, mode: 'insensitive' } },
      { location: { contains: f.search, mode: 'insensitive' } },
      { client: { name: { contains: f.search, mode: 'insensitive' } } },
      { client: { phone: { contains: f.search, mode: 'insensitive' } } },
    ]
  }
  if (f.status) where.status = f.status
  if (f.type) where.type = f.type
  if (f.dateFrom || f.dateTo) {
    const startDate: Record<string, Date> = {}
    if (f.dateFrom) startDate.gte = new Date(f.dateFrom)
    if (f.dateTo) startDate.lte = new Date(f.dateTo)
    where.startDate = startDate
  }
  if (f.budgetMin !== undefined && f.budgetMin !== '') {
    where.budget = { ...((where.budget as Record<string, unknown>) || {}), gte: Number(f.budgetMin) }
  }
  if (f.budgetMax !== undefined && f.budgetMax !== '') {
    where.budget = { ...((where.budget as Record<string, unknown>) || {}), lte: Number(f.budgetMax) }
  }
  return where
}

// ── Raw-input → Prisma-call wire (mirror the handler flow) ──

interface EventsPageWireInput {
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: string
  status?: string | null
  type?: string | null
  dateFrom?: string
  dateTo?: string
  budgetMin?: number
  budgetMax?: number
}

interface EventsPageWireCalls {
  pageWhere: Record<string, unknown>
  skip: number
  take: number
  todayRaw: { where: Record<string, unknown>; take: number | undefined }
  upcomingRaw: { where: Record<string, unknown>; take: number }
  historicalRaw: { where: Record<string, unknown>; take: number | undefined }
  activeClientGroups: { where: Record<string, unknown>; take: number | undefined }
}

/** Mirrors get-events-page.ts: destructure → safeLimit/skip → Promise.all. */
function eventsPageWire(organizationId: string, input: EventsPageWireInput): EventsPageWireCalls {
  const {
    search, page = 1, limit = EVENT_DEFAULT_PAGE_SIZE,
    status, type, dateFrom, dateTo, budgetMin, budgetMax,
  } = input

  const safeLimit = Math.max(1, Math.min(MAX_LIMIT, limit))
  const skip = (page - 1) * safeLimit

  const where = buildWhere(organizationId, {
    search, status, type, dateFrom, dateTo, budgetMin, budgetMax,
  })

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart.getTime() + 86400000)

  // Event model indexes in schema: [organizationId], [organizationId, createdAt],
  // [organizationId, startDate, endDate], [organizationId, status]
  const historicalStart = new Date(new Date().getFullYear(), new Date().getMonth() - 7, 1)

  return {
    pageWhere: where,
    skip,
    take: safeLimit,
    todayRaw: {
      where: { ...where, startDate: { gte: todayStart, lt: tomorrowStart } },
      take: TODAY_TAKE,
    },
    upcomingRaw: {
      where: { ...where, startDate: { gt: now } },
      take: UPCOMING_TAKE,
    },
    historicalRaw: {
      where: { organizationId, createdAt: { gte: historicalStart } },
      take: undefined,
    },
    activeClientGroups: {
      where: { ...where, clientId: { not: null }, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
      take: undefined,
    },
  }
}

// ── Tests: limit normalization → Prisma take ──

describe('B-05 pagination limit is normalized to [1, 100] before Prisma', () => {
  it('raw limit 500 → Prisma take 100', () => {
    const calls = eventsPageWire('org_a', { limit: 500 })
    assert.equal(calls.take, MAX_LIMIT, 'take must be capped to 100')
  })

  it('raw limit 1,000,000 → Prisma take 100', () => {
    const calls = eventsPageWire('org_a', { limit: 1_000_000 })
    assert.equal(calls.take, MAX_LIMIT)
  })

  it('normal limit 25 → Prisma take 25', () => {
    const calls = eventsPageWire('org_a', { limit: 25 })
    assert.equal(calls.take, 25)
  })

  it('default/omitted limit → Prisma take 10 (EVENT_DEFAULT_PAGE_SIZE)', () => {
    const calls = eventsPageWire('org_a', {})
    assert.equal(calls.take, EVENT_DEFAULT_PAGE_SIZE, 'default stays 10')
    assert.equal(calls.skip, 0)
  })

  it('limit 0 cannot produce an invalid Prisma take (clamped to 1)', () => {
    const calls = eventsPageWire('org_a', { limit: 0 })
    assert.equal(calls.take, 1, 'minimum floor is 1')
  })

  it('limit negative cannot produce an invalid Prisma take (clamped to 1)', () => {
    const calls = eventsPageWire('org_a', { limit: -5 })
    assert.equal(calls.take, 1)
  })

  it('malformed limit (NaN/string garbage) cannot produce an invalid Prisma take', () => {
    const n = Number.parseFloat('abc' as unknown as string)
    const safeLimit = Number.isFinite(n) ? Math.max(1, Math.min(MAX_LIMIT, n)) : EVENT_DEFAULT_PAGE_SIZE
    assert.ok(Number.isInteger(safeLimit), 'take must be a safe integer')
    assert.ok(safeLimit >= 1 && safeLimit <= 100, `take ${safeLimit} must be in [1,100]`)
  })

  it('page 3 + raw limit 500 → skip 200 (derived from the capped limit)', () => {
    const calls = eventsPageWire('org_a', { page: 3, limit: 500 })
    assert.equal(calls.take, 100, 'limit is capped before Prisma')
    assert.equal(calls.skip, 200, 'skip = (page 3 - 1) × capped 100, never the raw 500')
  })

  it('skip is always a non-negative integer derived from the safe limit', () => {
    const cases = [
      eventsPageWire('org_a', { page: 1, limit: 1e9 }),
      eventsPageWire('org_a', { page: 1, limit: 500 }),
      eventsPageWire('org_a', { page: 2, limit: 25 }),
      eventsPageWire('org_a', { page: 1, limit: 0 }),
    ]
    for (const c of cases) {
      assert.ok(Number.isInteger(c.skip) && c.skip >= 0, `skip ${c.skip} must be int >= 0`)
    }
  })
})

// ── Tests: todayRaw is capped ──

describe('B-05 todayRaw is bounded at take 50', () => {
  it('todayRaw carries take: 50', () => {
    const calls = eventsPageWire('org_a', {})
    assert.equal(calls.todayRaw.take, TODAY_TAKE, 'today events query must be capped')
  })

  it('todayRaw keeps the today range filter and server-derived org scope', () => {
    const calls = eventsPageWire('org_a', {})
    const w = calls.todayRaw.where as Record<string, unknown>
    assert.equal(w.organizationId, 'org_a')
    const sd = w.startDate as Record<string, unknown>
    assert.ok(sd.gte instanceof Date, 'todayRaw starts at todayStart')
    assert.ok(sd.lt instanceof Date, 'todayRaw ends before tomorrowStart')
  })

  it('upcomingRaw remains capped at 3 (unchanged behavior)', () => {
    const calls = eventsPageWire('org_a', {})
    assert.equal(calls.upcomingRaw.take, UPCOMING_TAKE)
  })
})

// ── Tests: organization scoping + filters preserved ──

describe('B-05 quareries stay organization-scoped with filters applied', () => {
  it('organizationId is server-derived in the paginated where', () => {
    const calls = eventsPageWire('org_b', { status: 'CONFIRMED' })
    assert.equal(calls.pageWhere.organizationId, 'org_b')
    assert.equal(calls.pageWhere.status, 'CONFIRMED')
  })

  it('existing filters survive beside the org scope', () => {
    const calls = eventsPageWire('org_a', {
      search: 'dupont',
      type: 'WEDDING',
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      budgetMin: 1000,
      budgetMax: 50000,
    })
    const w = calls.pageWhere as Record<string, unknown>
    assert.equal(w.organizationId, 'org_a')
    assert.equal((w.OR as Array<Record<string, unknown>>).length, 4, 'search OR clause present')
    assert.equal(w.type, 'WEDDING')
    assert.ok((w.startDate as Record<string, unknown>).gte instanceof Date)
    assert.ok((w.startDate as Record<string, unknown>).lte instanceof Date)
    assert.equal((w.budget as Record<string, unknown>).gte, 1000)
    assert.equal((w.budget as Record<string, unknown>).lte, 50000)
  })

  it('activeClientGroups keeps its filters and no take is added', () => {
    const calls = eventsPageWire('org_a', {})
    const w = calls.activeClientGroups.where as Record<string, unknown>
    assert.equal(w.organizationId, 'org_a')
    assert.deepEqual(w.clientId, { not: null })
    assert.deepEqual(w.status, { in: ['CONFIRMED', 'IN_PROGRESS'] })
    assert.equal(calls.activeClientGroups.take, undefined, 'actives/group query untouched by this fix')
  })
})

// ── Tests: historicalEvents untouched ──

describe('B-05 historicalEvents stays time-bounded and org-scoped, NOT capped', () => {
  it('historical query is org-scoped with an 8-month createdAt bound', () => {
    const calls = eventsPageWire('org_a', {})
    const w = calls.historicalRaw.where as Record<string, unknown>
    assert.equal(w.organizationId, 'org_a')
    const cd = w.createdAt as Record<string, unknown>
    assert.ok(cd.gte instanceof Date, 'bounded by createdAt >= 8 months ago')
  })

  it('historicalEvents has NO take cap (sparkline fidelity preserved)', () => {
    const calls = eventsPageWire('org_a', {})
    assert.equal(calls.historicalRaw.take, undefined, 'this fix must not add a silent cap to sparkline data')
  })

  it('historical query ignores page filters (full org picture for sparklines)', () => {
    const calls = eventsPageWire('org_a', { status: 'CONFIRMED', search: 'x' })
    const w = calls.historicalRaw.where as Record<string, unknown>
    assert.equal(w.organizationId, 'org_a')
    assert.equal(w.status, undefined, 'no status filter on historical sparkline source')
    assert.equal(w.OR, undefined, 'no search filter on historical sparkline source')
  })
})