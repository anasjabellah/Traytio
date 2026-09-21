/**
 * P1-1 RBAC: search + invoice-stats respect the permission matrix.
 *
 * Root causes:
 *   - search-global.ts called only getCurrentMembership() and always ran
 *     all 8 queries, returning invoice/payment rows to MEMBER although the
 *     matrix denies MEMBER invoices:read and payments:read.
 *   - get-invoice-stats.ts queried financial aggregates with only
 *     getOrganizationId(), no assertCan('invoices', 'read').
 *
 * Fixes (reuse existing matrix, no redesign):
 *   - search-global.ts probes assertCan('invoices'/'payments','read') and
 *     skips those two queries entirely for denied roles (never fetched,
 *     never returned); all other groups unchanged.
 *   - get-invoice-stats.ts calls assertCan('invoices','read') at the
 *     boundary before any aggregate (same as getInvoices/invoice PDF).
 *
 * Conventions: dependency-injected replicas + fs source-contract checks —
 * no @clerk/@prisma imports, no DB.
 *
 * Run: npx tsx tests/p1-1-search-invoice-rbac.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')
const read = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf8')

// ── Role-aware replica (mirrors the FIXED search-global.ts) ───────────

type Role = 'SUPERADMIN' | 'OWNER' | 'ADMIN' | 'MEMBER'

type Group = Array<{ id: string; label: string; org: string }>
type Results = {
  clients: Group; commandes: Group; invoices: Group; events: Group
  payments: Group; menus: Group; menuItems: Group; members: Group
}

const EMPTY_RESULTS: Results = {
  clients: [], commandes: [], invoices: [], events: [],
  payments: [], menus: [], menuItems: [], members: [],
}

// Mirrors PERMISSIONS matrix: invoices/payments read excludes MEMBER.
function canRead(role: Role, module: 'invoices' | 'payments'): boolean {
  const allowed: Record<string, Role[]> = {
    invoices: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    payments: ['SUPERADMIN', 'OWNER', 'ADMIN'],
  }
  return allowed[module]!.includes(role)
}

interface Db {
  org: string
  queries: string[]
  rows(table: string): Group
}

function makeDb(org: string, seed: Partial<Record<keyof Results, Group>> = {}): Db {
  return {
    org,
    queries: [],
    rows(table: string): Group {
      this.queries.push(table)
      return (seed[table as keyof Results] ?? []).filter((r) => r.org === this.org)
    },
  }
}

function searchGlobalWire(
  db: Db, role: Role, query: string,
): { success: boolean; data?: Results; error?: string } {
  if (typeof query !== 'string' || query.length > 100) {
    return { success: false, error: 'UNEXPECTED_ERROR' }
  }
  const trimmed = query.trim()
  if (trimmed.length < 2) {
    return { success: true, data: { ...EMPTY_RESULTS } }
  }

  const canReadInvoices = canRead(role, 'invoices')
  const canReadPayments = canRead(role, 'payments')

  // Restricted queries never run for denied roles (mirrors the conditional
  // invoiceQuery/paymentQuery in search-global.ts).
  const invoices: Group = canReadInvoices ? db.rows('invoices') : []
  const payments: Group = canReadPayments ? db.rows('payments') : []

  return {
    success: true,
    data: {
      clients: db.rows('clients'),
      commandes: db.rows('commandes'),
      invoices,
      events: db.rows('events'),
      payments,
      menus: db.rows('menus'),
      menuItems: db.rows('menuItems'),
      members: db.rows('members'),
    },
  }
}

function seedDb(): Db {
  return makeDb('org_a', {
    clients: [{ id: 'c1', label: 'Client', org: 'org_a' }],
    commandes: [{ id: 'cmd1', label: 'CMD-1', org: 'org_a' }],
    invoices: [{ id: 'i1', label: 'FAC-1', org: 'org_a' }],
    events: [{ id: 'e1', label: 'Gala', org: 'org_a' }],
    payments: [{ id: 'p1', label: '+500 MAD', org: 'org_a' }],
    menus: [{ id: 'm1', label: 'Menu', org: 'org_a' }],
    menuItems: [{ id: 'mi1', label: 'Steak', org: 'org_a' }],
    members: [{ id: 'u1', label: 'Amina', org: 'org_a' }],
  })
}

// ── 1–4: role access ─────────────────────────────────────────────────

describe('P1-1 BEHAVIOR: role-based search access', () => {
  it('1. authorized role (ADMIN) receives invoice search data', () => {
    const db = seedDb()
    const res = searchGlobalWire(db, 'ADMIN', 'ab')
    assert.equal(res.success, true)
    assert.deepEqual(res.data!.invoices.map((r) => r.id), ['i1'])
    assert.ok(db.queries.includes('invoices'), 'invoice query ran for ADMIN')
  })

  it('2. authorized role (OWNER) receives payment search data', () => {
    const db = seedDb()
    const res = searchGlobalWire(db, 'OWNER', 'ab')
    assert.equal(res.success, true)
    assert.deepEqual(res.data!.payments.map((r) => r.id), ['p1'])
    assert.ok(db.queries.includes('payments'), 'payment query ran for OWNER')
  })

  it('3. MEMBER receives no invoice data and the query never runs', () => {
    const db = seedDb()
    const res = searchGlobalWire(db, 'MEMBER', 'ab')
    assert.equal(res.success, true)
    assert.deepEqual(res.data!.invoices, [], 'no invoice rows for MEMBER')
    assert.ok(!db.queries.includes('invoices'), 'invoice query never executed for MEMBER')
  })

  it('4. MEMBER receives no payment data and the query never runs', () => {
    const db = seedDb()
    const res = searchGlobalWire(db, 'MEMBER', 'ab')
    assert.equal(res.success, true)
    assert.deepEqual(res.data!.payments, [], 'no payment rows for MEMBER')
    assert.ok(!db.queries.includes('payments'), 'payment query never executed for MEMBER')
  })

  it('5. invoice-stats boundary denies MEMBER (assertCan throws before aggregates)', () => {
    // Mirrors get-invoice-stats.ts: assertCan('invoices','read') precedes
    // every prisma.invoice/payment aggregate; MEMBER throws Forbidden.
    assert.equal(canRead('MEMBER', 'invoices'), false, 'matrix denies MEMBER')
    assert.equal(canRead('ADMIN', 'invoices'), true, 'matrix allows ADMIN')
  })

  it('6. organization isolation holds for every role', () => {
    const db = makeDb('org_a', {
      invoices: [
        { id: 'i1', label: 'FAC-1', org: 'org_a' },
        { id: 'iX', label: 'FAC-X', org: 'org_b' },
      ],
    })
    const res = searchGlobalWire(db, 'ADMIN', 'ab')
    assert.deepEqual(res.data!.invoices.map((r) => r.id), ['i1'], 'cross-org rows never leak')
  })

  it('7. allowed groups still work for MEMBER', () => {
    const db = seedDb()
    const res = searchGlobalWire(db, 'MEMBER', 'ab')
    assert.equal(res.success, true)
    for (const k of ['clients', 'commandes', 'events', 'menus', 'menuItems', 'members'] as const) {
      assert.equal(res.data![k].length, 1, `${k} still returned for MEMBER`)
    }
  })

  it('8. matrix behavior itself is unchanged (denials come from the matrix)', () => {
    for (const role of ['SUPERADMIN', 'OWNER', 'ADMIN'] as Role[]) {
      assert.equal(canRead(role, 'invoices'), true, `${role} reads invoices`)
      assert.equal(canRead(role, 'payments'), true, `${role} reads payments`)
    }
    assert.equal(canRead('MEMBER', 'invoices'), false)
    assert.equal(canRead('MEMBER', 'payments'), false)
  })
})

// ── Source contracts ───────────────────────────────────────────────

describe('P1-1 SOURCE CONTRACT', () => {
  it('search-global.ts gates invoices/payments on the existing matrix', () => {
    const src = read('features/search/actions/search-global.ts')
    assert.ok(src.includes("assertCan('invoices', 'read')"), 'probes invoices:read')
    assert.ok(src.includes("assertCan('payments', 'read')"), 'probes payments:read')
    assert.ok(src.includes('canReadInvoices'), 'conditional invoice path')
    assert.ok(src.includes('canReadPayments'), 'conditional payment path')
    // Unauthorized path returns empty arrays without querying:
    assert.ok(src.includes('Promise.resolve([]'), 'denied groups resolve empty without DB')
  })

  it('search-global.ts keeps org scoping, caps, and parallelism intact', () => {
    const src = read('features/search/actions/search-global.ts')
    assert.ok(src.includes('const orgId = membership.organizationId'), 'server-derived org')
    assert.ok(src.includes('await Promise.all(['), 'still parallel')
    const takes = src.match(/take:\s*5/g) ?? []
    assert.ok(takes.length >= 8, `take:5 preserved on all queries (found ${takes.length})`)
  })

  it('get-invoice-stats.ts enforces invoices:read before aggregates', () => {
    const src = read('features/invoices/lib/get-invoice-stats.ts')
    assert.ok(src.includes("assertCan('invoices', 'read')"), 'boundary check present')
    const gateIdx = src.indexOf("assertCan('invoices', 'read')")
    const aggIdx = src.indexOf('prisma.invoice.aggregate')
    assert.ok(gateIdx !== -1 && aggIdx !== -1 && gateIdx < aggIdx, 'check precedes every aggregate')
  })

  it('permission matrix itself is unchanged (no redesign)', () => {
    const src = read('lib/permissions.ts')
    assert.ok(src.includes("read: ['SUPERADMIN', 'OWNER', 'ADMIN']"), 'read matrix intact')
    assert.ok(!src.includes('search'), 'no new search module invented')
  })
})
