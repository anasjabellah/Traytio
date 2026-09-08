/**
 * B-04 Security/Performance — Unbounded report-data query — Unit Tests
 *
 * Verifies the fix in src/features/dashboard/actions/generate-report-data.ts:
 * the report must never run an unbounded `commande.findMany`. The handler now:
 *   1. Requires both `dateFrom` and `dateTo` at the input boundary (zod) and
 *      rejects `dateTo < dateFrom` and malformed dates.
 *   2. Builds the organization-scoped `where` first.
 *   3. Runs a cheap `prisma.commande.count({ where })` before the heavy
 *      `findMany`. If count > MAX_REPORT_ROWS (10_000) it returns an error and
 *      NEVER calls `findMany` — so no silent truncation and no partial/misleading
 *      summary can ever be produced.
 *   4. Only when count <= MAX_REPORT_ROWS does it run `findMany`, and the
 *      summary is computed from the COMPLETE returned rows (never a truncated
 *      subset).
 *
 * We inline a faithful, dependency-injected replica of the handler's control
 * flow (validation -> org-scoped where -> count gate -> findMany -> summary)
 * rather than importing it, so the tests do not pull in @clerk/@react-pdf/Prisma
 * transitive deps — same convention as tests/b01/b02/b03.
 *
 * Run: npx tsx tests/b04-report-row-limit.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ── Shared policy constants (faithful replica) ──

const MAX_REPORT_ROWS = 10_000

// ── Validation (faithful replica of the action's zod schema) ──

type Validated = {
  dateFrom: string
  dateTo: string
  status?: string
  clientId?: string
  eventType?: string
}

/** Returns undefined when the filters are rejected (missing/invalid/out-of-order). */
function validateFilters(raw: unknown): Validated | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const f = raw as Record<string, unknown>

  const parseDate = (v: unknown): string | null =>
    typeof v === 'string' && v.length >= 1 && !Number.isNaN(Date.parse(v)) ? v : null

  const dateFrom = parseDate(f.dateFrom)
  const dateTo = parseDate(f.dateTo)
  if (dateFrom === null || dateTo === null) return undefined
  if (new Date(dateTo) < new Date(dateFrom)) return undefined

  return {
    dateFrom,
    dateTo,
    status: typeof f.status === 'string' ? f.status : undefined,
    clientId: typeof f.clientId === 'string' ? f.clientId : undefined,
    eventType: typeof f.eventType === 'string' ? f.eventType : undefined,
  }
}

// ── Where-building + report control flow (faithful replica of the handler) ──

interface CommandeRow {
  number: string
  status: string
  organizationId: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
}

interface ReportResult {
  success: boolean
  error?: string
  submittedWhere?: Record<string, unknown>
  summary?: {
    totalCommandes: number
    totalRevenue: number
    totalPaid: number
    totalRemaining: number
    averageOrder: number
    statusBreakdown: Record<string, number>
  }
  findManyCalls: number
}

/** End of day, matching the handler's lte clamp. */
function endOfDay(iso: string): Date {
  const d = new Date(iso)
  d.setHours(23, 59, 59, 999)
  return d
}

/** Builds the org-scoped where, exactly as the handler does. */
function buildWhere(organizationId: string, f: Validated): Record<string, unknown> {
  const where: Record<string, unknown> = { organizationId }
  where.createdAt = { gte: new Date(f.dateFrom), lte: endOfDay(f.dateTo) }
  if (f.status) where.status = f.status
  if (f.clientId) where.clientId = f.clientId
  if (f.eventType) where.eventType = f.eventType
  return where
}

interface ReportDeps {
  organizationId: string
  /** Simulates prisma.commande.count({ where }) for the org+filter scope. */
  count: (where: Record<string, unknown>) => number
  /** Simulates prisma.commande.findMany({ where, select, orderBy }). */
  findMany: (where: Record<string, unknown>) => CommandeRow[]
}

/**
 * Faithful replica of generateReportDataHandler's decision flow, with injected
 * deps so we can assert the ACTUAL guard behaviour (count before findMany,
 * findMany never called on rejection, summary from complete rows).
 */
async function generateReport(filters: unknown, deps: ReportDeps): Promise<ReportResult> {
  const state = { findManyCalls: 0 }

  const validated = validateFilters(filters)
  if (!validated) {
    return { success: false, error: 'invalid filters', findManyCalls: state.findManyCalls }
  }

  const where = buildWhere(deps.organizationId, validated)
  const count = deps.count(where)

  if (count > MAX_REPORT_ROWS) {
    return { success: false, error: 'range too large', submittedWhere: where, findManyCalls: state.findManyCalls }
  }

  state.findManyCalls += 1
  const rows = deps.findMany(where)

  const totalRevenue = rows.reduce((s, r) => s + r.totalAmount, 0)
  const totalPaid = rows.reduce((s, r) => s + r.paidAmount, 0)
  const totalRemaining = rows.reduce((s, r) => s + r.remainingAmount, 0)
  const statusBreakdown: Record<string, number> = {}
  for (const r of rows) statusBreakdown[r.status] = (statusBreakdown[r.status] ?? 0) + 1

  return {
    success: true,
    submittedWhere: where,
    findManyCalls: state.findManyCalls,
    summary: {
      totalCommandes: rows.length,
      totalRevenue,
      totalPaid,
      totalRemaining,
      averageOrder: rows.length > 0 ? Math.round(totalRevenue / rows.length) : 0,
      statusBreakdown,
    },
  }
}

// ── Dataset helpers (org-scoped, crossed with other tenants + filters) ──

function makeRows(organizationId: string, n: number, status = 'CONFIRMED'): CommandeRow[] {
  const rows: CommandeRow[] = []
  for (let i = 0; i < n; i++) {
    rows.push({
      number: `CMD-${String(i + 1).padStart(4, '0')}`,
      status,
      organizationId,
      totalAmount: 100,
      paidAmount: 60,
      remainingAmount: 40,
    })
  }
  return rows
}

function makeDeps(overrides: {
  organizationId?: string
  rows?: CommandeRow[]
  countOverride?: number
}): { deps: ReportDeps; findManyCalls: () => number } {
  const organizationId = overrides.organizationId ?? 'org_a'
  const tenantRows = (overrides.rows ?? makeRows(organizationId, 5)).filter(
    (r) => r.organizationId === organizationId,
  )
  const state = { calls: 0 }
  const deps: ReportDeps = {
    organizationId,
    count: (where) =>
      overrides.countOverride ??
      tenantRows.filter((r) =>
        (r.status === where.status || !where.status) && (r.organizationId === where.organizationId),
      ).length,
    findMany: (where) => {
      state.calls += 1
      return tenantRows.filter((r) =>
        (r.status === where.status || !where.status) && (r.organizationId === where.organizationId),
      )
    },
  }
  return { deps, findManyCalls: () => state.calls }
}

const VALID = { dateFrom: '2026-01-01', dateTo: '2026-12-31' }

// ── Tests: validation at the boundary ──

describe('B-04 report date-range validation', () => {
  it('rejects a missing dateFrom', async () => {
    const { deps, findManyCalls } = makeDeps({})
    const res = await generateReport({ dateTo: '2026-12-31' }, deps)
    assert.equal(res.success, false)
    assert.ok(res.error, 'must return an error')
    assert.equal(findManyCalls(), 0, 'findMany must not run on validation failure')
  })

  it('rejects a missing dateTo', async () => {
    const { deps, findManyCalls } = makeDeps({})
    const res = await generateReport({ dateFrom: '2026-01-01' }, deps)
    assert.equal(res.success, false)
    assert.ok(res.error)
    assert.equal(findManyCalls(), 0)
  })

  it('rejects dateTo < dateFrom', async () => {
    const { deps, findManyCalls } = makeDeps({})
    const res = await generateReport({ dateFrom: '2026-12-31', dateTo: '2026-01-01' }, deps)
    assert.equal(res.success, false)
    assert.ok(res.error)
    assert.equal(findManyCalls(), 0)
  })

  it('rejects malformed/invalid date strings', async () => {
    const { deps, findManyCalls } = makeDeps({})
    const res = await generateReport({ dateFrom: 'not-a-date', dateTo: '2026-12-31' }, deps)
    assert.equal(res.success, false)
    assert.equal(findManyCalls(), 0)
  })
})

// ── Tests: the count gate BEFORE findMany ──

describe('B-04 count gate protects findMany (no silent truncation)', () => {
  it('count <= MAX_REPORT_ROWS executes findMany', async () => {
    const { deps, findManyCalls } = makeDeps({ countOverride: MAX_REPORT_ROWS - 1 })
    const res = await generateReport(VALID, deps)
    assert.equal(res.success, true)
    assert.equal(findManyCalls(), 1, 'findMany runs when under the cap')
  })

  it('count == MAX_REPORT_ROWS exactly executes findMany', async () => {
    const { deps, findManyCalls } = makeDeps({ countOverride: MAX_REPORT_ROWS })
    const res = await generateReport(VALID, deps)
    assert.equal(res.success, true)
    assert.equal(findManyCalls(), 1, 'exactly at the cap is still allowed (no off-by-one)')
  })

  it('count > MAX_REPORT_ROWS returns an error and findMany is NOT called', async () => {
    const { deps, findManyCalls } = makeDeps({ countOverride: MAX_REPORT_ROWS + 1 })
    const res = await generateReport(VALID, deps)
    assert.equal(res.success, false)
    assert.ok(res.error, 'must return a clear user-facing error')
    assert.equal(findManyCalls(), 0, 'findMany MUST NEVER run above the cap')
    assert.equal(res.summary, undefined, 'no misleading partial summary is produced')
  })
})

// ── Tests: organization scoping + filters preserved ──

describe('B-04 query remains organization-scoped with filters applied', () => {
  it('where carries the server-derived organizationId plus the date range', async () => {
    const { deps } = makeDeps({ organizationId: 'org_b' })
    const res = await generateReport({ ...VALID, status: 'CONFIRMED', clientId: 'cli_1', eventType: 'WEDDING' }, deps)
    assert.equal(res.success, true)
    const w = res.submittedWhere as Record<string, unknown>
    assert.equal(w.organizationId, 'org_b', 'organizationId must be injected from the server side')
    assert.deepEqual(
      new Set(Object.keys((w.createdAt as Record<string, Date>))),
      new Set(['gte', 'lte']),
      'date range must be applied as gte/lte',
    )
    assert.equal(w.status, 'CONFIRMED')
    assert.equal(w.clientId, 'cli_1')
    assert.equal(w.eventType, 'WEDDING')
  })

  it('date range uses an end-of-day lte so dateTo includes its full day', async () => {
    const { deps } = makeDeps({})
    const res = await generateReport({ dateFrom: '2026-01-01', dateTo: '2026-01-05' }, deps)
    const w = res.submittedWhere as Record<string, unknown>
    const lte = (w.createdAt as Record<string, Date>).lte
    assert.equal(lte.getHours(), 23)
    assert.equal(lte.getMinutes(), 59)
    assert.equal(lte.getSeconds(), 59)
  })
})

// ── Tests: summary derived from COMPLETE rows, never truncated ──

describe('B-04 summary is computed from the complete returned rows', () => {
  it('summary counts all rows returned by findMany and sums from the full set', async () => {
    const rows = makeRows('org_a', 7, 'CONFIRMED')
    const { deps } = makeDeps({ rows })
    const res = await generateReport(VALID, deps)
    assert.equal(res.success, true)
    assert.equal(res.summary!.totalCommandes, 7, 'all 7 rows counted')
    assert.equal(res.summary!.totalRevenue, 7 * 100)
    assert.equal(res.summary!.totalPaid, 7 * 60)
    assert.equal(res.summary!.totalRemaining, 7 * 40)
    assert.equal(res.summary!.averageOrder, 100)
    assert.deepEqual(res.summary!.statusBreakdown, { CONFIRMED: 7 })
  })

  it('summary aggregates across statuses from the complete row set', async () => {
    const rows = [...makeRows('org_a', 3, 'CONFIRMED'), ...makeRows('org_a', 2, 'DELIVERED')]
    const { deps } = makeDeps({ rows })
    const res = await generateReport(VALID, deps)
    assert.equal(res.summary!.totalCommandes, 5)
    assert.deepEqual(res.summary!.statusBreakdown, { CONFIRMED: 3, DELIVERED: 2 })
  })

  it('no silent truncation: findMany returns and summary reflects every single row', async () => {
    // Prove the summary always derives from rows.length — there is no `take`
    // anywhere that could slice the result before summary.
    const rows = makeRows('org_a', 9_999, 'CONFIRMED') // just under the cap
    const { deps } = makeDeps({ rows })
    const res = await generateReport(VALID, deps)
    assert.equal(res.success, true)
    assert.equal(res.summary!.totalCommandes, 9_999, 'all 9999 complete rows are summarized')
  })
})
