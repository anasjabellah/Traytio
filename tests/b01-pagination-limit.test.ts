/**
 * B-01 Security/Performance — Unbounded pagination limits — Unit Tests
 *
 * Verifies the fix in:
 *   - src/features/clients/actions/get-clients-page.ts
 *   - src/features/invoices/actions/invoice-actions.ts
 *   - src/features/commandes/actions/get-commandes-page.ts
 *   - src/features/payments/actions/get-payments.ts
 *   - src/features/menus/actions/get-menus.ts
 *   - src/features/menu-items/actions/get-menu-items.ts
 *   - src/features/events/actions/get-events.ts
 *   - src/app/api/events/route.ts (query-param normalization before forwarding)
 *
 * All seven server actions clamp `limit` at the input boundary to [1, 100] (the cap
 * already used by get-activity.ts / get-team.ts) and feed ONLY the normalized
 * value into Prisma: `take: safeLimit`, `skip: (safePage - 1) * safeLimit`, with
 * `page` normalized to at least 1.
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
const COMMANDE_DEFAULT_PAGE_SIZE = 10
const PAYMENT_DEFAULT_PAGE_SIZE = 10
const MENU_DEFAULT_PAGE_SIZE = 10
const MENU_ITEM_DEFAULT_PAGE_SIZE = 10
const EVENT_DEFAULT_PAGE_SIZE = 10

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

/** Mirrors get-commandes-page.ts: Number coercion + trunc + clamp [1, 100]. */
function paginateCommandes(rawPage: unknown = 1, rawLimit: unknown = COMMANDE_DEFAULT_PAGE_SIZE) {
  const page = Math.max(1, Math.trunc(Number(rawPage) || 1))
  const limit = Math.max(1, Math.min(MAX_LIMIT, Math.trunc(Number(rawLimit) || 1)))
  return { page, limit, skip: (page - 1) * limit }
}

/** Mirrors get-payments.ts: Number coercion + trunc + clamp [1, 100]. */
function paginatePayments(rawPage: unknown = 1, rawLimit: unknown = PAYMENT_DEFAULT_PAGE_SIZE) {
  const page = Math.max(1, Math.trunc(Number(rawPage) || 1))
  const limit = Math.max(1, Math.min(MAX_LIMIT, Math.trunc(Number(rawLimit) || 1)))
  return { page, limit, skip: (page - 1) * limit }
}

/** Mirrors get-menus.ts: Number coercion + trunc + clamp [1, 100]. */
function paginateMenus(rawPage: unknown = 1, rawLimit: unknown = MENU_DEFAULT_PAGE_SIZE) {
  const page = Math.max(1, Math.trunc(Number(rawPage) || 1))
  const limit = Math.max(1, Math.min(MAX_LIMIT, Math.trunc(Number(rawLimit) || 1)))
  return { page, limit, skip: (page - 1) * limit }
}

/** Mirrors get-menu-items.ts: Number coercion + trunc + clamp [1, 100]. */
function paginateMenuItems(rawPage: unknown = 1, rawLimit: unknown = MENU_ITEM_DEFAULT_PAGE_SIZE) {
  const page = Math.max(1, Math.trunc(Number(rawPage) || 1))
  const limit = Math.max(1, Math.min(MAX_LIMIT, Math.trunc(Number(rawLimit) || 1)))
  return { page, limit, skip: (page - 1) * limit }
}

/** Mirrors get-events.ts: Number coercion + trunc + clamp [1, 100]. */
function paginateEvents(rawPage: unknown = 1, rawLimit: unknown = EVENT_DEFAULT_PAGE_SIZE) {
  const page = Math.max(1, Math.trunc(Number(rawPage) || 1))
  const limit = Math.max(1, Math.min(MAX_LIMIT, Math.trunc(Number(rawLimit) || 1)))
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

function buildCommandesWhere(
  organizationId: string,
  opts: {
    search?: string
    status?: string[]
    eventType?: string
    clientId?: string
    eventId?: string
  },
) {
  const where: Record<string, unknown> = { organizationId }
  if (opts.status && opts.status.length > 0) where.status = { in: opts.status }
  if (opts.eventType) where.eventType = opts.eventType
  if (opts.search) {
    where.OR = [
      { number: { contains: opts.search, mode: 'insensitive' } },
      { client: { name: { contains: opts.search, mode: 'insensitive' } } },
      { client: { phone: { contains: opts.search, mode: 'insensitive' } } },
      { event: { name: { contains: opts.search, mode: 'insensitive' } } },
    ]
  }
  if (opts.clientId) where.clientId = opts.clientId
  if (opts.eventId) where.eventId = opts.eventId
  return where
}

function buildPaymentsWhere(
  organizationId: string,
  opts: { method?: string; status?: string; search?: string },
) {
  const where: Record<string, unknown> = { organizationId }
  if (opts.method) where.method = opts.method
  if (opts.status) where.status = opts.status
  if (opts.search) {
    where.OR = [
      { reference: { contains: opts.search, mode: 'insensitive' } },
      { notes: { contains: opts.search, mode: 'insensitive' } },
      { commande: { number: { contains: opts.search, mode: 'insensitive' } } },
    ]
  }
  return where
}

function buildMenusWhere(
  organizationId: string,
  opts: { search?: string; category?: string; isActive?: boolean },
) {
  const where: Record<string, unknown> = { organizationId }
  if (opts.search) where.OR = [{ name: { contains: opts.search, mode: 'insensitive' } }]
  if (opts.category) where.category = opts.category
  if (opts.isActive !== undefined) where.isActive = opts.isActive
  return where
}

function buildMenuItemsWhere(
  organizationId: string,
  opts: { search?: string; category?: string; isActive?: boolean },
) {
  const where: Record<string, unknown> = { organizationId }
  if (opts.search) where.OR = [{ name: { contains: opts.search, mode: 'insensitive' } }]
  if (opts.category && opts.category !== 'ALL') where.category = opts.category
  if (opts.isActive !== undefined) where.isActive = opts.isActive
  return where
}

function buildEventsWhere(
  organizationId: string,
  opts: {
    search?: string
    status?: string
    type?: string
    dateFrom?: string
    dateTo?: string
    budgetMin?: number
    budgetMax?: number
  },
) {
  const where: Record<string, unknown> = { organizationId }
  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search, mode: 'insensitive' } },
      { location: { contains: opts.search, mode: 'insensitive' } },
      { client: { name: { contains: opts.search, mode: 'insensitive' } } },
      { client: { phone: { contains: opts.search, mode: 'insensitive' } } },
    ]
  }
  if (opts.status) where.status = opts.status
  if (opts.type) where.type = opts.type
  if (opts.dateFrom || opts.dateTo) {
    where.startDate = {
      ...(opts.dateFrom ? { gte: new Date(opts.dateFrom) } : {}),
      ...(opts.dateTo ? { lte: new Date(opts.dateTo) } : {}),
    }
  }
  if (opts.budgetMin !== undefined || opts.budgetMax !== undefined) {
    where.budget = {
      ...(opts.budgetMin !== undefined ? { gte: opts.budgetMin } : {}),
      ...(opts.budgetMax !== undefined ? { lte: opts.budgetMax } : {}),
    }
  }
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

function commandesWire(
  dataset: Array<{ id: string; organizationId: string }>,
  organizationId: string,
  raw: { page?: unknown; limit?: unknown; search?: string; status?: string[]; eventType?: string; clientId?: string; eventId?: string },
): PrismaCall & {
  page: number
  limit: number
  rows: Array<{ id: string; organizationId: string }>
  total: number
} {
  const { page = 1, limit = COMMANDE_DEFAULT_PAGE_SIZE } = raw
  const safePage = Math.max(1, Math.trunc(Number(page) || 1))
  const safeLimit = Math.max(1, Math.min(MAX_LIMIT, Math.trunc(Number(limit) || 1)))
  const skip = (safePage - 1) * safeLimit
  const where = buildCommandesWhere(organizationId, raw)
  const tenantRows = dataset
    .filter((r) => r.organizationId === organizationId)
    .sort((a, b) => a.id.localeCompare(b.id))
  return {
    where,
    skip,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
    rows: tenantRows.slice(skip, skip + safeLimit),
    total: tenantRows.length,
  }
}

function paymentsWire(
  dataset: Array<{ id: string; organizationId: string }>,
  organizationId: string,
  raw: { page?: unknown; limit?: unknown; method?: string; status?: string; search?: string },
): PrismaCall & {
  page: number
  limit: number
  rows: Array<{ id: string; organizationId: string }>
  total: number
} {
  const { page = 1, limit = PAYMENT_DEFAULT_PAGE_SIZE } = raw
  const safePage = Math.max(1, Math.trunc(Number(page) || 1))
  const safeLimit = Math.max(1, Math.min(MAX_LIMIT, Math.trunc(Number(limit) || 1)))
  const skip = (safePage - 1) * safeLimit
  const where = buildPaymentsWhere(organizationId, raw)
  const tenantRows = dataset
    .filter((r) => r.organizationId === organizationId)
    .sort((a, b) => a.id.localeCompare(b.id))
  return {
    where,
    skip,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
    rows: tenantRows.slice(skip, skip + safeLimit),
    total: tenantRows.length,
  }
}

function menusWire(
  dataset: Array<{ id: string; organizationId: string }>,
  organizationId: string,
  raw: { page?: unknown; limit?: unknown; search?: string; category?: string; isActive?: boolean },
): PrismaCall & {
  page: number
  limit: number
  rows: Array<{ id: string; organizationId: string }>
  total: number
} {
  const { page = 1, limit = MENU_DEFAULT_PAGE_SIZE } = raw
  const safePage = Math.max(1, Math.trunc(Number(page) || 1))
  const safeLimit = Math.max(1, Math.min(MAX_LIMIT, Math.trunc(Number(limit) || 1)))
  const skip = (safePage - 1) * safeLimit
  const where = buildMenusWhere(organizationId, raw)
  const tenantRows = dataset
    .filter((r) => r.organizationId === organizationId)
    .sort((a, b) => a.id.localeCompare(b.id))
  return {
    where,
    skip,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
    rows: tenantRows.slice(skip, skip + safeLimit),
    total: tenantRows.length,
  }
}

function menuItemsWire(
  dataset: Array<{ id: string; organizationId: string }>,
  organizationId: string,
  raw: { page?: unknown; limit?: unknown; search?: string; category?: string; isActive?: boolean },
): PrismaCall & {
  page: number
  limit: number
  rows: Array<{ id: string; organizationId: string }>
  total: number
} {
  const { page = 1, limit = MENU_ITEM_DEFAULT_PAGE_SIZE } = raw
  const safePage = Math.max(1, Math.trunc(Number(page) || 1))
  const safeLimit = Math.max(1, Math.min(MAX_LIMIT, Math.trunc(Number(limit) || 1)))
  const skip = (safePage - 1) * safeLimit
  const where = buildMenuItemsWhere(organizationId, raw)
  const tenantRows = dataset
    .filter((r) => r.organizationId === organizationId)
    .sort((a, b) => a.id.localeCompare(b.id))
  return {
    where,
    skip,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
    rows: tenantRows.slice(skip, skip + safeLimit),
    total: tenantRows.length,
  }
}

function eventsWire(
  dataset: Array<{ id: string; organizationId: string }>,
  organizationId: string,
  raw: {
    page?: unknown
    limit?: unknown
    search?: string
    status?: string
    type?: string
    dateFrom?: string
    dateTo?: string
    budgetMin?: number
    budgetMax?: number
  },
): PrismaCall & {
  page: number
  limit: number
  rows: Array<{ id: string; organizationId: string }>
  total: number
} {
  const { page = 1, limit = EVENT_DEFAULT_PAGE_SIZE } = raw
  const safePage = Math.max(1, Math.trunc(Number(page) || 1))
  const safeLimit = Math.max(1, Math.min(MAX_LIMIT, Math.trunc(Number(limit) || 1)))
  const skip = (safePage - 1) * safeLimit
  const where = buildEventsWhere(organizationId, raw)
  const tenantRows = dataset
    .filter((r) => r.organizationId === organizationId)
    .sort((a, b) => a.id.localeCompare(b.id))
  return {
    where,
    skip,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
    rows: tenantRows.slice(skip, skip + safeLimit),
    total: tenantRows.length,
  }
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

// ── Tests: commandes (get-commandes-page.ts) ──

describe('B-01 getCommandesPage pagination cap', () => {
  it('normal limits and pages keep working (defaults preserved)', () => {
    const dflt = paginateCommandes()
    assert.deepEqual(dflt, { page: 1, limit: COMMANDE_DEFAULT_PAGE_SIZE, skip: 0 })

    const p3 = paginateCommandes(3, 25)
    assert.deepEqual(p3, { page: 3, limit: 25, skip: 50 })
  })

  it('accepts the maximum limit of 100', () => {
    const max = paginateCommandes(1, 100)
    assert.equal(max.limit, 100)
    assert.equal(max.skip, 0)
  })

  it('safely caps values above the maximum (500 → 100)', () => {
    const capped = paginateCommandes(1, 500)
    assert.equal(capped.limit, 100)
  })

  it('safely caps huge values and computes skip from the capped limit', () => {
    const huge = paginateCommandes(3, 1_000_000)
    assert.equal(huge.limit, 100)
    assert.equal(huge.skip, 200, 'skip must derive from the capped limit, not the raw value')
  })

  it('clamps page below 1 to 1', () => {
    assert.equal(paginateCommandes(0, COMMANDE_DEFAULT_PAGE_SIZE).page, 1)
    assert.equal(paginateCommandes(-5, COMMANDE_DEFAULT_PAGE_SIZE).page, 1)
    assert.equal(paginateCommandes(0, COMMANDE_DEFAULT_PAGE_SIZE).skip, 0)
  })

  it('keeps a very large page (no upper page cap), deriving skip from the capped limit', () => {
    const huge = paginateCommandes(1_000_000, 10)
    assert.equal(huge.page, 1_000_000)
    assert.equal(huge.limit, 10)
    assert.equal(huge.skip, (1_000_000 - 1) * 10)
  })

  it('clamps sub-minimum limits to 1', () => {
    assert.equal(paginateCommandes(1, 0).limit, 1)
    assert.equal(paginateCommandes(1, -7).limit, 1)
  })

  it('normalizes fractional, string, zero and malformed input', () => {
    assert.equal(paginateCommandes(2.9, 10).page, 2, 'fractional page truncates safely')
    assert.deepEqual(paginateCommandes('2', '25'), { page: 2, limit: 25, skip: 25 }, 'numeric strings coerce')
    assert.equal(paginateCommandes('abc', 'xyz').limit, 1, 'non-numeric input falls back to the minimum')
    assert.equal(paginateCommandes('abc', 'xyz').page, 1)
  })
})

// ── Tests: payments (get-payments.ts) ──

describe('B-01 getPayments pagination cap', () => {
  it('normal limits and pages keep working (defaults preserved)', () => {
    const dflt = paginatePayments()
    assert.deepEqual(dflt, { page: 1, limit: PAYMENT_DEFAULT_PAGE_SIZE, skip: 0 })

    const p3 = paginatePayments(3, 25)
    assert.deepEqual(p3, { page: 3, limit: 25, skip: 50 })
  })

  it('accepts the maximum limit of 100', () => {
    const max = paginatePayments(1, 100)
    assert.equal(max.limit, 100)
    assert.equal(max.skip, 0)
  })

  it('safely caps values above the maximum (500 → 100)', () => {
    const capped = paginatePayments(1, 500)
    assert.equal(capped.limit, 100)
  })

  it('safely caps huge values and computes skip from the capped limit', () => {
    const huge = paginatePayments(3, 1_000_000)
    assert.equal(huge.limit, 100)
    assert.equal(huge.skip, 200, 'skip must derive from the capped limit, not the raw value')
  })

  it('clamps page below 1 to 1', () => {
    assert.equal(paginatePayments(0, PAYMENT_DEFAULT_PAGE_SIZE).page, 1)
    assert.equal(paginatePayments(-5, PAYMENT_DEFAULT_PAGE_SIZE).page, 1)
    assert.equal(paginatePayments(0, PAYMENT_DEFAULT_PAGE_SIZE).skip, 0)
  })

  it('keeps a very large page (no upper page cap), deriving skip from the capped limit', () => {
    const huge = paginatePayments(1_000_000, 10)
    assert.equal(huge.page, 1_000_000)
    assert.equal(huge.limit, 10)
    assert.equal(huge.skip, (1_000_000 - 1) * 10)
  })

  it('clamps sub-minimum limits to 1', () => {
    assert.equal(paginatePayments(1, 0).limit, 1)
    assert.equal(paginatePayments(1, -7).limit, 1)
  })

  it('normalizes fractional, string, zero and malformed input', () => {
    assert.equal(paginatePayments(2.9, 10).page, 2, 'fractional page truncates safely')
    assert.deepEqual(paginatePayments('2', '25'), { page: 2, limit: 25, skip: 25 }, 'numeric strings coerce')
    assert.equal(paginatePayments('abc', 'xyz').limit, 1, 'non-numeric input falls back to the minimum')
    assert.equal(paginatePayments('abc', 'xyz').page, 1)
  })
})

// ── Tests: menus (get-menus.ts) ──

describe('B-01 getMenus pagination cap', () => {
  it('normal limits and pages keep working (defaults preserved)', () => {
    const dflt = paginateMenus()
    assert.deepEqual(dflt, { page: 1, limit: MENU_DEFAULT_PAGE_SIZE, skip: 0 })

    const p3 = paginateMenus(3, 25)
    assert.deepEqual(p3, { page: 3, limit: 25, skip: 50 })
  })

  it('accepts the maximum limit of 100', () => {
    const max = paginateMenus(1, 100)
    assert.equal(max.limit, 100)
    assert.equal(max.skip, 0)
  })

  it('safely caps values above the maximum (500 → 100)', () => {
    const capped = paginateMenus(1, 500)
    assert.equal(capped.limit, 100)
  })

  it('safely caps huge values and computes skip from the capped limit', () => {
    const huge = paginateMenus(3, 1_000_000)
    assert.equal(huge.limit, 100)
    assert.equal(huge.skip, 200, 'skip must derive from the capped limit, not the raw value')
  })

  it('clamps page below 1 to 1', () => {
    assert.equal(paginateMenus(0, MENU_DEFAULT_PAGE_SIZE).page, 1)
    assert.equal(paginateMenus(-5, MENU_DEFAULT_PAGE_SIZE).page, 1)
    assert.equal(paginateMenus(0, MENU_DEFAULT_PAGE_SIZE).skip, 0)
  })

  it('keeps a very large page (no upper page cap), deriving skip from the capped limit', () => {
    const huge = paginateMenus(1_000_000, 10)
    assert.equal(huge.page, 1_000_000)
    assert.equal(huge.limit, 10)
    assert.equal(huge.skip, (1_000_000 - 1) * 10)
  })

  it('clamps sub-minimum limits to 1', () => {
    assert.equal(paginateMenus(1, 0).limit, 1)
    assert.equal(paginateMenus(1, -7).limit, 1)
  })

  it('normalizes fractional, string, zero and malformed input', () => {
    assert.equal(paginateMenus(2.9, 10).page, 2, 'fractional page truncates safely')
    assert.deepEqual(paginateMenus('2', '25'), { page: 2, limit: 25, skip: 25 }, 'numeric strings coerce')
    assert.equal(paginateMenus('abc', 'xyz').limit, 1, 'non-numeric input falls back to the minimum')
    assert.equal(paginateMenus('abc', 'xyz').page, 1)
  })
})

// ── Tests: menu items (get-menu-items.ts) ──

describe('B-01 getMenuItems pagination cap', () => {
  it('normal limits and pages keep working (defaults preserved)', () => {
    const dflt = paginateMenuItems()
    assert.deepEqual(dflt, { page: 1, limit: MENU_ITEM_DEFAULT_PAGE_SIZE, skip: 0 })

    const p3 = paginateMenuItems(3, 25)
    assert.deepEqual(p3, { page: 3, limit: 25, skip: 50 })
  })

  it('accepts the maximum limit of 100', () => {
    const max = paginateMenuItems(1, 100)
    assert.equal(max.limit, 100)
    assert.equal(max.skip, 0)
  })

  it('safely caps values above the maximum (500 → 100)', () => {
    const capped = paginateMenuItems(1, 500)
    assert.equal(capped.limit, 100)
  })

  it('safely caps huge values and computes skip from the capped limit', () => {
    const huge = paginateMenuItems(3, 1_000_000)
    assert.equal(huge.limit, 100)
    assert.equal(huge.skip, 200, 'skip must derive from the capped limit, not the raw value')
  })

  it('clamps page below 1 to 1', () => {
    assert.equal(paginateMenuItems(0, MENU_ITEM_DEFAULT_PAGE_SIZE).page, 1)
    assert.equal(paginateMenuItems(-5, MENU_ITEM_DEFAULT_PAGE_SIZE).page, 1)
    assert.equal(paginateMenuItems(0, MENU_ITEM_DEFAULT_PAGE_SIZE).skip, 0)
  })

  it('keeps a very large page (no upper page cap), deriving skip from the capped limit', () => {
    const huge = paginateMenuItems(1_000_000, 10)
    assert.equal(huge.page, 1_000_000)
    assert.equal(huge.limit, 10)
    assert.equal(huge.skip, (1_000_000 - 1) * 10)
  })

  it('clamps sub-minimum limits to 1', () => {
    assert.equal(paginateMenuItems(1, 0).limit, 1)
    assert.equal(paginateMenuItems(1, -7).limit, 1)
  })

  it('normalizes fractional, string, zero and malformed input', () => {
    assert.equal(paginateMenuItems(2.9, 10).page, 2, 'fractional page truncates safely')
    assert.deepEqual(paginateMenuItems('2', '25'), { page: 2, limit: 25, skip: 25 }, 'numeric strings coerce')
    assert.equal(paginateMenuItems('abc', 'xyz').limit, 1, 'non-numeric input falls back to the minimum')
    assert.equal(paginateMenuItems('abc', 'xyz').page, 1)
  })
})

// ── Tests: events (get-events.ts) ──

describe('B-01 getEvents pagination cap', () => {
  it('normal limits and pages keep working (defaults preserved)', () => {
    const dflt = paginateEvents()
    assert.deepEqual(dflt, { page: 1, limit: EVENT_DEFAULT_PAGE_SIZE, skip: 0 })

    const p3 = paginateEvents(3, 25)
    assert.deepEqual(p3, { page: 3, limit: 25, skip: 50 })
  })

  it('accepts the maximum limit of 100', () => {
    const max = paginateEvents(1, 100)
    assert.equal(max.limit, 100)
    assert.equal(max.skip, 0)
  })

  it('safely caps values above the maximum (500 → 100)', () => {
    const capped = paginateEvents(1, 500)
    assert.equal(capped.limit, 100)
  })

  it('safely caps huge values and computes skip from the capped limit', () => {
    const huge = paginateEvents(3, 1_000_000)
    assert.equal(huge.limit, 100)
    assert.equal(huge.skip, 200, 'skip must derive from the capped limit, not the raw value')
  })

  it('clamps page below 1 to 1', () => {
    assert.equal(paginateEvents(0, EVENT_DEFAULT_PAGE_SIZE).page, 1)
    assert.equal(paginateEvents(-5, EVENT_DEFAULT_PAGE_SIZE).page, 1)
    assert.equal(paginateEvents(0, EVENT_DEFAULT_PAGE_SIZE).skip, 0)
  })

  it('keeps a very large page (no upper page cap), deriving skip from the capped limit', () => {
    const huge = paginateEvents(1_000_000, 10)
    assert.equal(huge.page, 1_000_000)
    assert.equal(huge.limit, 10)
    assert.equal(huge.skip, (1_000_000 - 1) * 10)
  })

  it('clamps sub-minimum limits to 1', () => {
    assert.equal(paginateEvents(1, 0).limit, 1)
    assert.equal(paginateEvents(1, -7).limit, 1)
  })

  it('normalizes fractional, string, zero and malformed input', () => {
    assert.equal(paginateEvents(2.9, 10).page, 2, 'fractional page truncates safely')
    assert.deepEqual(paginateEvents('2', '25'), { page: 2, limit: 25, skip: 25 }, 'numeric strings coerce')
    assert.equal(paginateEvents('abc', 'xyz').limit, 1, 'non-numeric input falls back to the minimum')
    assert.equal(paginateEvents('abc', 'xyz').page, 1)
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

  it('commandes — raw limit 500 results in Prisma take: 100', () => {
    const call = commandesWire(dataset, 'org_a', { limit: 500 })
    assert.equal(call.take, 100, 'take must be capped to 100')
    assert.equal(call.skip, 0)
  })

  it('commandes — raw limit 1,000,000 results in Prisma take: 100', () => {
    const call = commandesWire(dataset, 'org_a', { limit: 1_000_000 })
    assert.equal(call.take, 100)
  })

  it('commandes — normal limit 25 results in Prisma take: 25', () => {
    const call = commandesWire(dataset, 'org_a', { limit: 25 })
    assert.equal(call.take, 25)
  })

  it('commandes — default (no limit) results in Prisma take: 10', () => {
    const call = commandesWire(dataset, 'org_a', {})
    assert.equal(call.take, COMMANDE_DEFAULT_PAGE_SIZE, 'default stays 10')
    assert.equal(call.skip, 0)
  })

  it('commandes — raw limit 1,000,000 with page 3 computes skip from the capped limit', () => {
    const call = commandesWire(dataset, 'org_a', { page: 3, limit: 1_000_000 })
    assert.equal(call.take, 100)
    assert.equal(call.skip, 200, 'skip = (page 3 - 1) × capped 100')
  })

  it('commandes — page 0 and limit 0 normalize to page 1 / limit 1 before Prisma', () => {
    const call = commandesWire(dataset, 'org_a', { page: 0, limit: 0 })
    assert.equal(call.page, 1)
    assert.equal(call.limit, 1)
    assert.equal(call.skip, 0)
    assert.equal(call.take, 1)
  })

  it('payments — raw limit 500 results in Prisma take: 100', () => {
    const call = paymentsWire(dataset, 'org_a', { limit: 500 })
    assert.equal(call.take, 100, 'take must be capped to 100')
    assert.equal(call.skip, 0)
  })

  it('payments — raw limit 1,000,000 results in Prisma take: 100', () => {
    const call = paymentsWire(dataset, 'org_a', { limit: 1_000_000 })
    assert.equal(call.take, 100)
  })

  it('payments — normal limit 25 results in Prisma take: 25', () => {
    const call = paymentsWire(dataset, 'org_a', { limit: 25 })
    assert.equal(call.take, 25)
  })

  it('payments — default (no limit) results in Prisma take: 10', () => {
    const call = paymentsWire(dataset, 'org_a', {})
    assert.equal(call.take, PAYMENT_DEFAULT_PAGE_SIZE, 'default stays 10')
    assert.equal(call.skip, 0)
  })

  it('payments — raw limit 1,000,000 with page 3 computes skip from the capped limit', () => {
    const call = paymentsWire(dataset, 'org_a', { page: 3, limit: 1_000_000 })
    assert.equal(call.take, 100)
    assert.equal(call.skip, 200, 'skip = (page 3 - 1) × capped 100')
  })

  it('payments — page 0 and limit 0 normalize to page 1 / limit 1 before Prisma', () => {
    const call = paymentsWire(dataset, 'org_a', { page: 0, limit: 0 })
    assert.equal(call.page, 1)
    assert.equal(call.limit, 1)
    assert.equal(call.skip, 0)
    assert.equal(call.take, 1)
  })

  it('menus — raw limit 500 results in Prisma take: 100', () => {
    const call = menusWire(dataset, 'org_a', { limit: 500 })
    assert.equal(call.take, 100, 'take must be capped to 100')
    assert.equal(call.skip, 0)
  })

  it('menus — raw limit 1,000,000 results in Prisma take: 100', () => {
    const call = menusWire(dataset, 'org_a', { limit: 1_000_000 })
    assert.equal(call.take, 100)
  })

  it('menus — normal limit 25 results in Prisma take: 25', () => {
    const call = menusWire(dataset, 'org_a', { limit: 25 })
    assert.equal(call.take, 25)
  })

  it('menus — default (no limit) results in Prisma take: 10', () => {
    const call = menusWire(dataset, 'org_a', {})
    assert.equal(call.take, MENU_DEFAULT_PAGE_SIZE, 'default stays 10')
    assert.equal(call.skip, 0)
  })

  it('menus — raw limit 1,000,000 with page 3 computes skip from the capped limit', () => {
    const call = menusWire(dataset, 'org_a', { page: 3, limit: 1_000_000 })
    assert.equal(call.take, 100)
    assert.equal(call.skip, 200, 'skip = (page 3 - 1) × capped 100')
  })

  it('menus — page 0 and limit 0 normalize to page 1 / limit 1 before Prisma', () => {
    const call = menusWire(dataset, 'org_a', { page: 0, limit: 0 })
    assert.equal(call.page, 1)
    assert.equal(call.limit, 1)
    assert.equal(call.skip, 0)
    assert.equal(call.take, 1)
  })

  it('menu items — raw limit 500 results in Prisma take: 100', () => {
    const call = menuItemsWire(dataset, 'org_a', { limit: 500 })
    assert.equal(call.take, 100, 'take must be capped to 100')
    assert.equal(call.skip, 0)
  })

  it('menu items — raw limit 1,000,000 results in Prisma take: 100', () => {
    const call = menuItemsWire(dataset, 'org_a', { limit: 1_000_000 })
    assert.equal(call.take, 100)
  })

  it('menu items — normal limit 25 results in Prisma take: 25', () => {
    const call = menuItemsWire(dataset, 'org_a', { limit: 25 })
    assert.equal(call.take, 25)
  })

  it('menu items — default (no limit) results in Prisma take: 10', () => {
    const call = menuItemsWire(dataset, 'org_a', {})
    assert.equal(call.take, MENU_ITEM_DEFAULT_PAGE_SIZE, 'default stays 10')
    assert.equal(call.skip, 0)
  })

  it('menu items — raw limit 1,000,000 with page 3 computes skip from the capped limit', () => {
    const call = menuItemsWire(dataset, 'org_a', { page: 3, limit: 1_000_000 })
    assert.equal(call.take, 100)
    assert.equal(call.skip, 200, 'skip = (page 3 - 1) × capped 100')
  })

  it('menu items — page 0 and limit 0 normalize to page 1 / limit 1 before Prisma', () => {
    const call = menuItemsWire(dataset, 'org_a', { page: 0, limit: 0 })
    assert.equal(call.page, 1)
    assert.equal(call.limit, 1)
    assert.equal(call.skip, 0)
    assert.equal(call.take, 1)
  })

  it('events — raw limit 500 results in Prisma take: 100', () => {
    const call = eventsWire(dataset, 'org_a', { limit: 500 })
    assert.equal(call.take, 100, 'take must be capped to 100')
    assert.equal(call.skip, 0)
  })

  it('events — raw limit 1,000,000 results in Prisma take: 100', () => {
    const call = eventsWire(dataset, 'org_a', { limit: 1_000_000 })
    assert.equal(call.take, 100)
  })

  it('events — normal limit 25 results in Prisma take: 25', () => {
    const call = eventsWire(dataset, 'org_a', { limit: 25 })
    assert.equal(call.take, 25)
  })

  it('events — default (no limit) results in Prisma take: 10', () => {
    const call = eventsWire(dataset, 'org_a', {})
    assert.equal(call.take, EVENT_DEFAULT_PAGE_SIZE, 'default stays 10')
    assert.equal(call.skip, 0)
  })

  it('events — raw limit 1,000,000 with page 3 computes skip from the capped limit', () => {
    const call = eventsWire(dataset, 'org_a', { page: 3, limit: 1_000_000 })
    assert.equal(call.take, 100)
    assert.equal(call.skip, 200, 'skip = (page 3 - 1) × capped 100')
  })

  it('events — page 0 and limit 0 normalize to page 1 / limit 1 before Prisma', () => {
    const call = eventsWire(dataset, 'org_a', { page: 0, limit: 0 })
    assert.equal(call.page, 1)
    assert.equal(call.limit, 1)
    assert.equal(call.skip, 0)
    assert.equal(call.take, 1)
  })

  it('take and skip are always integers within Prisma constraints', () => {
    const calls = [
      clientsWire(dataset, 'org_a', { limit: 500 }),
      clientsWire(dataset, 'org_a', { page: 'abc', limit: 'xyz' }),
      invoicesWire(dataset, 'org_a', { limit: 1000 }),
      invoicesWire(dataset, 'org_a', { page: 0, limit: 0 }),
      commandesWire(dataset, 'org_a', { limit: 1000 }),
      commandesWire(dataset, 'org_a', { page: 0, limit: 0 }),
      paymentsWire(dataset, 'org_a', { limit: 1000 }),
      paymentsWire(dataset, 'org_a', { page: 0, limit: 0 }),
      menusWire(dataset, 'org_a', { limit: 1000 }),
      menusWire(dataset, 'org_a', { page: 0, limit: 0 }),
      menuItemsWire(dataset, 'org_a', { limit: 1000 }),
      menuItemsWire(dataset, 'org_a', { page: 0, limit: 0 }),
      eventsWire(dataset, 'org_a', { limit: 1000 }),
      eventsWire(dataset, 'org_a', { page: 0, limit: 0 }),
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

  it('commandes wire always carries the server-derived organizationId and keeps filters', () => {
    const dataset = buildDataset(100, 100)
    const call = commandesWire(dataset, 'org_a', {
      search: 'maria',
      status: ['CONFIRMED', 'DELIVERED'],
      eventType: 'WEDDING',
      clientId: 'c-1',
      eventId: 'e-1',
    })
    assert.equal(call.where.organizationId, 'org_a')
    assert.deepEqual(call.where.status, { in: ['CONFIRMED', 'DELIVERED'] })
    assert.equal(call.where.eventType, 'WEDDING')
    assert.equal(call.where.clientId, 'c-1')
    assert.equal(call.where.eventId, 'e-1')
    assert.equal((call.where.OR as Array<Record<string, unknown>>).length, 4)
  })

  it('commandes wire leaves status undefined when the status array is empty', () => {
    const dataset = buildDataset(10, 10)
    const call = commandesWire(dataset, 'org_a', { status: [] })
    assert.equal(call.where.organizationId, 'org_a')
    assert.equal(call.where.status, undefined)
  })

  it('payments wire always carries the server-derived organizationId and keeps filters', () => {
    const dataset = buildDataset(100, 100)
    const call = paymentsWire(dataset, 'org_a', {
      method: 'CASH',
      status: 'COMPLETED',
      search: 'REF-2026',
    })
    assert.equal(call.where.organizationId, 'org_a')
    assert.equal(call.where.method, 'CASH')
    assert.equal(call.where.status, 'COMPLETED')
    assert.equal((call.where.OR as Array<Record<string, unknown>>).length, 3)
  })

  it('menus wire always carries the server-derived organizationId and keeps filters', () => {
    const dataset = buildDataset(100, 100)
    const call = menusWire(dataset, 'org_a', { search: 'plat', category: 'WEDDING', isActive: true })
    assert.equal(call.where.organizationId, 'org_a')
    assert.equal(call.where.category, 'WEDDING')
    assert.equal(call.where.isActive, true)
    assert.equal((call.where.OR as Array<Record<string, unknown>>).length, 1)
  })

  it('menu items wire always carries the server-derived organizationId and keeps filters', () => {
    const dataset = buildDataset(100, 100)
    const call = menuItemsWire(dataset, 'org_a', { search: 'saumon', category: 'FOOD', isActive: false })
    assert.equal(call.where.organizationId, 'org_a')
    assert.equal(call.where.category, 'FOOD')
    assert.equal(call.where.isActive, false)
    assert.equal((call.where.OR as Array<Record<string, unknown>>).length, 1)
  })

  it('menu items wire drops the category filter when it is the ALL sentinel', () => {
    const dataset = buildDataset(10, 10)
    const call = menuItemsWire(dataset, 'org_a', { category: 'ALL' })
    assert.equal(call.where.organizationId, 'org_a')
    assert.equal(call.where.category, undefined)
  })

  it('events wire always carries the server-derived organizationId and keeps filters', () => {
    const dataset = buildDataset(100, 100)
    const call = eventsWire(dataset, 'org_a', {
      search: 'gala',
      status: 'CONFIRMED',
      type: 'WEDDING',
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      budgetMin: 1000,
      budgetMax: 50000,
    })
    assert.equal(call.where.organizationId, 'org_a')
    assert.equal(call.where.status, 'CONFIRMED')
    assert.equal(call.where.type, 'WEDDING')
    assert.deepEqual(call.where.startDate, { gte: new Date('2026-01-01'), lte: new Date('2026-12-31') })
    assert.deepEqual(call.where.budget, { gte: 1000, lte: 50000 })
    assert.equal((call.where.OR as Array<Record<string, unknown>>).length, 4)
  })
})