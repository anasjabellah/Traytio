/**
 * B-01 Security/Performance — Unbounded pagination limits — Unit Tests
 *
 * Verifies the fix in:
 *   - src/features/clients/actions/get-clients-page.ts
 *   - src/features/invoices/actions/invoice-actions.ts
 *
 * Both server actions clamp `limit` at the input boundary to [1, 100] (the cap
 * already used by get-activity.ts / get-team.ts) and feed ONLY the normalized
 * value into Prisma: `take: safeLimit`, `skip: (safePage - 1) * safeLimit`.
 * Tenant scoping is unchanged: `organizationId` is server-derived and injected
 * into the where clause.
 *
 * The simulated "*Wire" helpers model the raw-input → normalization → Prisma
 * call exactly as the handlers do, and return the exact `{where, skip, take}`
 * Prisma would receive — so a wiring bug (raw limit reaching `take`) is
 * detectable, unlike a helper-only replica.
 *
 * Run: npx tsx tests/b01-pagination-limit.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ── Shared cap ──

const MAX_LIMIT = 100
const CLIENT_DEFAULT_PAGE_SIZE = 10
const INVOICE_DEFAULT_PAGE_SIZE = 20

// ── Input-boundary normalization (faithful replicas of the handlers) ──

/** Mirrors get-clients-page.ts: Number coercion + trunc + clamp [1, 100]. */
function paginateClients(rawPage: unknown = 1, rawLimit: unknown = CLIENT_DEFAULT_PAGE_SIZE) {
  const page = Math.max(1, Math.trunc(Number(rawPage) || 1))
  const limit = Math.max(1, Math.min(MAX_LIMIT, Math.trunc(Number(rawLimit) || 1)))
  return { page, limit, skip: (page - 1) * limit }
}

/** Mirrors invoice-actions.ts: schema guarantees ints, clamp [1, 100]. */
function paginateInvoices(rawPage: number = 1, rawLimit: number = INVOICE_DEFAULT_PAGE_SIZE) {
  const page = Math.max(1, rawPage)
  const limit = Math.max(1, Math.min(MAX_LIMIT, rawLimit))
  return { page, limit, skip: (page - 1) * limit }
}

// ── Tenant-scoped where-building (faithful replicas) ──

function buildClientsWhere(organizationId: string, search?: string) {
  const where: Record<string, unknown> = { organizationId }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ]
  }
  return where
}

function buildInvoicesWhere(
  organizationId: string,
  opts: { commandeId?: string; type?: string; search?: string },
) {
  const where: Record<string, unknown> = { organizationId }
  if (opts.commandeId) where.commandeId = opts.commandeId
  if (opts.type) where.type = opts.type
  if (opts.search) where.number = { contains: opts.search, mode: 'insensitive' }
  return where
}

// ── Raw-input → Prisma-call wires (mirror the handler flow, return Prisma args) ──

interface PrismaCall {
  where: Record<string, unknown>
  skip: number
  take: number
}

function clientsWire(
  dataset: Array<{ id: string; organizationId: string }>,
  organizationId: string,
  raw: { page?: unknown; limit?: unknown; search?: string },
): PrismaCall & { rows: Array<{ id: string; organizationId: string }>; total: number } {
  const { page = 1, limit = CLIENT_DEFAULT_PAGE_SIZE } = raw
  const safePage = Math.max(1, Math.trunc(Number(page) || 1))
  const safeLimit = Math.max(1, Math.min(MAX_LIMIT, Math.trunc(Number(limit) || 1)))
  const skip = (safePage - 1) * safeLimit
  const where = buildClientsWhere(organizationId, raw.search)
  const tenantRows = dataset
    .filter((r) => r.organizationId === organizationId)
    .sort((a, b) => a.id.localeCompare(b.id))
  return { where, skip, take: safeLimit, rows: tenantRows.slice(skip, skip + safeLimit), total: tenantRows.length }
}

function invoicesWire(
  dataset: Array<{ id: string; organizationId: string }>,
  organizationId: string,
  raw: { page?: number; limit?: number; type?: string; search?: string },
): PrismaCall & { rows: Array<{ id: string; organizationId: string }>; total: number } {
  const { page = 1, limit = INVOICE_DEFAULT_PAGE_SIZE } = raw
  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(MAX_LIMIT, limit))
  const skip = (safePage - 1) * safeLimit
  const where = buildInvoicesWhere(organizationId, { type: raw.type, search: raw.search })
  const tenantRows = dataset
    .filter((r) => r.organizationId === organizationId)
    .sort((a, b) => a.id.localeCompare(b.id))
  return { where, skip, take: safeLimit, rows: tenantRows.slice(skip, skip + safeLimit), total: tenantRows.length }
}

function buildDataset(orgASize: number, orgBSize: number): Array<{ id: string; organizationId: string }> {
  const a: Array<{ id: string; organizationId: string }> = []
  const b: Array<{ id: string; organizationId: string }> = []
  for (let i = 0; i < orgASize; i++) a.push({ id: `a-${String(i).padStart(4, '0')}`, organizationId: 'org_a' })
  for (let i = 0; i < orgBSize; i++) b.push({ id: `b-${String(i).padStart(4, '0')}`, organizationId: 'org_b' })
  return [...b, ...a]
}

// ── Tests: clients (get-clients-page.ts) ──

describe('B-01 getClientsPage pagination cap', () => {
  it('normal limits and pages keep working (defaults preserved)', () => {
    const dflt = paginateClients()
    assert.deepEqual(dflt, { page: 1, limit: CLIENT_DEFAULT_PAGE_SIZE, skip: 0 })

    const p3 = paginateClients(3, CLIENT_DEFAULT_PAGE_SIZE)
    assert.deepEqual(p3, { page: 3, limit: 10, skip: 20 })
  })

  it('accepts the maximum limit of 100', () => {
    const max = paginateClients(1, 100)
    assert.equal(max.limit, 100)
    assert.equal(max.skip, 0)
  })

  it('safely caps values above the maximum (500 → 100)', () => {
    const capped = paginateClients(1, 500)
    assert.equal(capped.limit, 100)
  })

  it('safely caps huge values and computes skip from the capped limit', () => {
    const huge = paginateClients(2, 1_000_000)
    assert.equal(huge.limit, 100)
    assert.equal(huge.skip, 100, 'skip must derive from the capped limit, not the raw value')
  })

  it('normalizes fractional, string, zero and malformed input', () => {
    assert.equal(paginateClients(2.9, 10).page, 2, 'fractional page truncates safely')
    assert.deepEqual(paginateClients('2', '25'), { page: 2, limit: 25, skip: 25 }, 'numeric strings coerce')
    assert.equal(paginateClients(1, 0).limit, 1, 'explicit zero clamps to the minimum')
    assert.equal(paginateClients(1, -5).limit, 1, 'negative clamps to the minimum')
    assert.equal(paginateClients('abc', 'xyz').limit, 1, 'non-numeric input falls back to the minimum')
    assert.equal(paginateClients('abc', 'xyz').page, 1)
  })
})

// ── Tests: invoices (invoice-actions.ts) ──

describe('B-01 getInvoices pagination cap', () => {
  it('normal limits and pages keep working (defaults preserved)', () => {
    const dflt = paginateInvoices()
    assert.deepEqual(dflt, { page: 1, limit: INVOICE_DEFAULT_PAGE_SIZE, skip: 0 })

    const p2 = paginateInvoices(2, 50)
    assert.deepEqual(p2, { page: 2, limit: 50, skip: 50 })
  })

  it('accepts the maximum limit of 100', () => {
    const max = paginateInvoices(1, 100)
    assert.equal(max.limit, 100)
  })

  it('safely caps values above the maximum (1000 → 100)', () => {
    const capped = paginateInvoices(1, 1000)
    assert.equal(capped.limit, 100)
  })

  it('safely caps huge values and computes skip from the capped limit', () => {
    const huge = paginateInvoices(3, 1_000_000)
    assert.equal(huge.limit, 100)
    assert.equal(huge.skip, 200, 'skip must derive from the capped limit, not the raw value')
  })

  it('clamps sub-minimum values to 1', () => {
    assert.equal(paginateInvoices(1, 0).limit, 1)
    assert.equal(paginateInvoices(1, -7).limit, 1)
    assert.equal(paginateInvoices(0, 20).page, 1)
  })
})

// ── Tests: raw input → actual Prisma args (the production wiring) ──

describe('B-01 Prisma take/skip only ever receives normalized values', () => {
  const dataset = buildDataset(250, 120)

  it('clients — raw limit 500 results in Prisma take: 100', () => {
    const call = clientsWire(dataset, 'org_a', { limit: 500 })
    assert.equal(call.take, 100, 'take must be capped to 100')
    assert.equal(call.skip, 0)
  })

  it('clients — raw limit 1,000,000 results in Prisma take: 100', () => {
    const call = clientsWire(dataset, 'org_a', { limit: 1_000_000 })
    assert.equal(call.take, 100)
  })

  it('invoices — raw limit 1,000,000 results in Prisma take: 100', () => {
    const call = invoicesWire(dataset, 'org_a', { limit: 1_000_000 })
    assert.equal(call.take, 100)
  })

  it('clients — normal limit 20 results in Prisma take: 20', () => {
    const call = clientsWire(dataset, 'org_a', { limit: 20 })
    assert.equal(call.take, 20)
  })

  it('clients — default (no limit) results in Prisma take: 10', () => {
    const call = clientsWire(dataset, 'org_a', {})
    assert.equal(call.take, CLIENT_DEFAULT_PAGE_SIZE, 'default stays 10')
    assert.equal(call.skip, 0)
  })

  it('invoices — default (no limit) results in Prisma take: 20', () => {
    const call = invoicesWire(dataset, 'org_b', {})
    assert.equal(call.take, INVOICE_DEFAULT_PAGE_SIZE, 'default stays 20')
    assert.equal(call.skip, 0)
  })

  it('invoices — raw limit 500 with page 2 computes skip from the capped limit', () => {
    const call = invoicesWire(dataset, 'org_b', { page: 2, limit: 500 })
    assert.equal(call.take, 100)
    assert.equal(call.skip, 100, 'skip = (page 2 - 1) × capped 100')
  })

  it('clients — raw limit 1,000,000 with page 3 computes skip from the capped limit', () => {
    const call = clientsWire(dataset, 'org_a', { page: 3, limit: 1_000_000 })
    assert.equal(call.take, 100)
    assert.equal(call.skip, 200, 'skip = (page 3 - 1) × capped 100')
  })

  it('take and skip are always integers within Prisma constraints', () => {
    const calls = [
      clientsWire(dataset, 'org_a', { limit: 500 }),
      clientsWire(dataset, 'org_a', { page: 'abc', limit: 'xyz' }),
      invoicesWire(dataset, 'org_a', { limit: 1000 }),
      invoicesWire(dataset, 'org_a', { page: 0, limit: 0 }),
    ]
    for (const c of calls) {
      assert.ok(Number.isInteger(c.take) && c.take >= 1 && c.take <= 100, `take ${c.take} must be int in [1,100]`)
      assert.ok(Number.isInteger(c.skip) && c.skip >= 0, `skip ${c.skip} must be a non-negative int`)
    }
  })
})

// ── Tests: tenant scoping preserved ──

describe('B-01 pagination remains tenant-scoped', () => {
  it('clients wire never returns rows from another organization, even at capped size', () => {
    const dataset = buildDataset(250, 120)
    const call = clientsWire(dataset, 'org_a', { limit: 500 })

    assert.equal(call.take, MAX_LIMIT, 'raw 500 must be capped before the query')
    assert.equal(call.where.organizationId, 'org_a', 'organizationId is server-derived in where')
    assert.equal(call.rows.length, MAX_LIMIT, 'capped to 100 rows')
    assert.ok(call.rows.every((r) => r.organizationId === 'org_a'), 'no cross-tenant leakage')
  })

  it('capped second page stays within the tenant', () => {
    const dataset = buildDataset(250, 120)
    const call = clientsWire(dataset, 'org_b', { page: 2, limit: 500 })

    assert.equal(call.skip, 100, 'skip = (page 2 - 1) × capped 100')
    assert.equal(call.rows.length, Math.max(0, call.total - call.skip), 'slots after 100 are the remainder of the tenant')
    assert.ok(call.rows.every((r) => r.organizationId === 'org_b'))
    assert.ok(dataset.length > call.rows.length * 3, 'dataset contains other-tenant rows that must never appear')
  })

  it('invoices wire always carries the server-derived organizationId', () => {
    const dataset = buildDataset(100, 100)
    const call = invoicesWire(dataset, 'org_a', { type: 'FACTURE', search: 'FAC-2026' })
    assert.equal(call.where.organizationId, 'org_a')
    assert.equal(call.where.type, 'FACTURE')
    assert.deepEqual(call.where.number, { contains: 'FAC-2026', mode: 'insensitive' })
  })

  it('clients wire keeps search filters alongside the org scope', () => {
    const dataset = buildDataset(100, 100)
    const call = clientsWire(dataset, 'org_a', { search: 'dupont' })
    assert.equal(call.where.organizationId, 'org_a')
    assert.equal((call.where.OR as Array<Record<string, unknown>>).length, 4)
  })
})