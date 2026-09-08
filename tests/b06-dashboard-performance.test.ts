/**
 * B-06 Performance — Dashboard duplicate-query remediation — Unit Tests
 *
 * Verifies the fix in src/features/dashboard/lib/get-dashboard-data-sections.ts:
 * the dashboard page fires the SAME heavy queries multiple times inside a single
 * server render. This fix routes every consumer through request-scoped React
 * `cache()` helpers so each identical Prisma call executes ONCE per request:
 *
 *   C1 — getCompletedPaymentRows() — the 24-month COMPLETED payment findMany is
 *        fetched independently by fetchKpiSection, fetchRevenueChartSection and
 *        fetchBusinessHealthSection → now exactly ONE payment.findMany call.
 *   C2 — getPaymentAgg() / getPendingAgg() — the all-time COMPLETED payment sum
 *        and the pending-deposit commande sum are both computed by
 *        fetchKpiSection AND fetchPaymentsSection → each aggregates exactly once.
 *   S1 — getRecentCommandes() — recent commandes (take 5) are fetched by both
 *        fetchRecentCommandesSection and fetchSidebarSection → one findMany call,
 *        with the SUPERSET select (id, number, createdAt, totalAmount, status,
 *        client.name) so the sidebar's fallback-activity data stays intact.
 *
 * React `cache()` keys on the function AND its arguments using Object.is. That
 * is why getTimeBase() is also cached: every section receives the SAME
 * `twentyFourMonthsAgo` Date reference, otherwise the Date argument would break
 * the identity key and deduplication would silently fail. The replica cache
 * below models this identity-keyed, request-scoped behaviour faithfully.
 *
 * Same convention as tests/b01/b02/b03/b04/b05 — we inline a faithful,
 * dependency-injected replica of the wiring rather than importing the module,
 * so no @clerk / @prisma / React transitive deps are pulled in.
 *
 * Run: npx tsx tests/b06-dashboard-performance.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ── Request-scoped identity cache (faithful model of React cache()) ──

const VALUE = Symbol('cache-value')

/** Returns a request-scoped `cache()` that keys on fn + args via Object.is. */
function createCache() {
  const fnRoots = new Map<(...args: never[]) => unknown, Map<unknown, unknown>>()
  return function cache<T extends (...args: never[]) => unknown>(fn: T): T {
    let fnRoot = fnRoots.get(fn)
    if (!fnRoot) {
      fnRoot = new Map()
      fnRoots.set(fn, fnRoot)
    }
    return ((...args: never[]) => {
      let node: Map<unknown, unknown> = fnRoot
      for (const arg of args) {
        let next = node.get(arg) as Map<unknown, unknown> | undefined
        if (!next) {
          next = new Map()
          node.set(arg, next)
        }
        node = next
      }
      if (node.has(VALUE)) return node.get(VALUE)
      const result = fn(...args)
      node.set(VALUE, result)
      return result
    }) as T
  }
}

// ── Time-zone helpers inlined from src/lib/date-utils.ts (Africa/Casablanca) ──

const TZ = 'Africa/Casablanca'

function tzDateKey(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: TZ })
}

function tzMonthKey(d: Date): string {
  return tzDateKey(d).slice(0, 7)
}

// ── Fixed "now" so map/sparkline/activity assertions are deterministic ──

const FIXED_NOW = new Date(2026, 8, 15, 12, 0, 0, 0)

function makeTimeBase(now: Date) {
  const currentYear = now.getFullYear()
  const startOfYear = new Date(currentYear, 0, 1)
  const startOfToday = new Date(currentYear, now.getMonth(), now.getDate())
  const endOfToday = new Date(currentYear, now.getMonth(), now.getDate() + 1)
  const twentyFourMonthsAgo = new Date(currentYear, now.getMonth() - 23, 1)
  const [curTzY, curTzM] = tzDateKey(now).split('-').map(Number)
  const last8Months: { key: string; start: Date }[] = []
  for (let i = 7; i >= 0; i--) {
    let y = curTzY, m = curTzM - i
    while (m <= 0) { y--; m += 12 }
    const key = `${y}-${String(m).padStart(2, '0')}`
    last8Months.push({ key, start: new Date(y, m - 1, 1) })
  }
  const eightMonthsAgo = last8Months[0].start
  const monthKeys = last8Months.map((m) => m.key)
  return { now, currentYear, startOfYear, startOfToday, endOfToday, twentyFourMonthsAgo, eightMonthsAgo, monthKeys }
}

// ── Prisma call log + fake prisma ──

interface CallArgs {
  where?: Record<string, unknown>
  take?: number
  orderBy?: Record<string, 'asc' | 'desc'>
  select?: Record<string, unknown>
  _sum?: Record<string, true>
}

type PrismaCall = { method: string; args: CallArgs }

interface PaymentRow {
  amount: number
  createdAt: Date
}

interface RecentCommande {
  id: string
  number: string
  createdAt: Date
  totalAmount: number
  status: string
  client: { name: string } | null
}

interface FixtureData {
  paymentRows: PaymentRow[]
  paymentSum: number | null
  pendingSum: number | null
  commandes: RecentCommande[]
}

function makePrisma(data: FixtureData, log: PrismaCall[]) {
  return {
    payment: {
      findMany: (args: CallArgs) => {
        log.push({ method: 'payment.findMany', args })
        return data.paymentRows
      },
      aggregate: (args: CallArgs) => {
        log.push({ method: 'payment.aggregate', args })
        return { _sum: { amount: data.paymentSum } }
      },
    },
    commande: {
      findMany: (args: CallArgs) => {
        log.push({ method: 'commande.findMany', args })
        return data.commandes
      },
      aggregate: (args: CallArgs) => {
        log.push({ method: 'commande.aggregate', args })
        return { _sum: { remainingAmount: data.pendingSum } }
      },
      count: (args: CallArgs) => {
        log.push({ method: 'commande.count', args })
        return 4
      },
    },
  }
}

// ── Build a full request replica (mirrors get-dashboard-data-sections.ts) ──

type TimeBase = ReturnType<typeof makeTimeBase>

function createTimeBaseFactory(): (fixed: Date) => TimeBase {
  return (fixed) => makeTimeBase(fixed)
}

function makeRequest(opts: {
  org: string
  cacheEnabled: boolean
  data: FixtureData
  log: PrismaCall[]
}) {
  const { org, cacheEnabled, data, log } = opts
  const cache = createCache()
  const C = <T extends (...args: never[]) => unknown>(fn: T) => {
    return cacheEnabled ? (cache(fn) as T) : fn
  }

  const state = { getOrgCalls: 0, assertCanCalls: 0 }

  const prisma = makePrisma(data, log)

  const getOrganizationId = async (): Promise<string> => {
    state.getOrgCalls += 1
    return org
  }
  const assertCan = async (): Promise<void> => {
    state.assertCanCalls += 1
  }

  // getTimeBase is itself cached so every section shares the SAME Date references
  const makeT = createTimeBaseFactory()
  const getTimeBase = cacheEnabled ? cache(makeT) : makeT
  const t = getTimeBase(FIXED_NOW)

  const getOrgAndCheck = C(async () => {
    const organizationId = await getOrganizationId()
    await assertCan()
    return organizationId
  })

  const getCompletedPaymentRows = C(async (organizationId: string, twentyFourMonthsAgo: Date) => {
    return (await prisma.payment.findMany({
      where: { organizationId, status: 'COMPLETED', createdAt: { gte: twentyFourMonthsAgo } },
      select: { amount: true, createdAt: true },
    })) as unknown as PaymentRow[]
  })

  const getPaymentAgg = C(async (organizationId: string) => {
    return (await prisma.payment.aggregate({
      where: { organizationId, status: 'COMPLETED' },
      _sum: { amount: true },
    })) as unknown as { _sum: { amount: number | null } }
  })

  const getPendingAgg = C(async (organizationId: string) => {
    return (await prisma.commande.aggregate({
      where: { organizationId, remainingAmount: { gt: 0 }, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
      _sum: { remainingAmount: true },
    })) as unknown as { _sum: { remainingAmount: number | null } }
  })

  const getRecentCommandes = C(async (organizationId: string) => {
    return (await prisma.commande.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, number: true, createdAt: true, totalAmount: true, status: true,
        client: { select: { name: true } },
      },
    })) as unknown as RecentCommande[]
  })

  // ── fetchKpiSection replica (C1 + C2 consumers, financial outputs) ──
  const fetchKpiSection = async () => {
    const organizationId = await getOrgAndCheck()
    const [paymentAgg, paymentRows, pendingAgg] = await Promise.all([
      getPaymentAgg(organizationId),
      getCompletedPaymentRows(organizationId, t.twentyFourMonthsAgo),
      getPendingAgg(organizationId),
    ])
    const monthlyMap = new Map<string, number>()
    const paidMonthlyMap = new Map<string, number>()
    for (const pmt of paymentRows) {
      const monthKey = tzMonthKey(new Date(pmt.createdAt))
      const val = Number(pmt.amount)
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + val)
      paidMonthlyMap.set(monthKey, (paidMonthlyMap.get(monthKey) || 0) + val)
    }
    return {
      totalRevenue: Math.round(Number(paymentAgg._sum?.amount || 0)),
      paymentsReceived: Math.round(Number(paymentAgg._sum?.amount || 0)),
      pendingDeposits: Math.round(Number(pendingAgg._sum.remainingAmount || 0)),
      monthlyMap,
      paidMonthlyMap,
    }
  }

  // ── fetchRevenueChartSection replica (C1 consumer + revenueMaps) ──
  const fetchRevenueChartSection = async () => {
    const organizationId = await getOrgAndCheck()
    const paymentRows = await getCompletedPaymentRows(organizationId, t.twentyFourMonthsAgo)
    const dailyMap = new Map<string, number>()
    const monthlyMap = new Map<string, number>()
    const paidMonthlyMap = new Map<string, number>()
    for (const pmt of paymentRows) {
      const d = new Date(pmt.createdAt)
      const dayKey = tzDateKey(d)
      const monthKey = tzMonthKey(d)
      const val = Number(pmt.amount)
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + val)
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + val)
      paidMonthlyMap.set(monthKey, (paidMonthlyMap.get(monthKey) || 0) + val)
    }
    return {
      revenueMaps: {
        daily: Object.fromEntries(dailyMap),
        monthly: Object.fromEntries(monthlyMap),
        paidMonthly: Object.fromEntries(paidMonthlyMap),
      },
    }
  }

  // ── fetchBusinessHealthSection replica (C1 consumer + monthlyGrowth) ──
  const fetchBusinessHealthSection = async () => {
    const organizationId = await getOrgAndCheck()
    const paymentRows = await getCompletedPaymentRows(organizationId, t.twentyFourMonthsAgo)
    const monthlyMap = new Map<string, number>()
    for (const pmt of paymentRows) {
      const key = tzMonthKey(new Date(pmt.createdAt))
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(pmt.amount))
    }
    const thisMonthKey = tzMonthKey(t.now)
    const lastMonthDate = new Date(t.now.getFullYear(), t.now.getMonth() - 1, 1)
    const lastMonthKey = tzMonthKey(lastMonthDate)
    const thisMonthRev = monthlyMap.get(thisMonthKey) || 0
    const lastMonthRev = monthlyMap.get(lastMonthKey) || 0
    const monthlyGrowth = lastMonthRev > 0
      ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100)
      : 0
    return { monthlyMap, monthlyGrowth }
  }

  // ── fetchPaymentsSection replica (C2 consumer, financial outputs) ──
  const fetchPaymentsSection = async () => {
    const organizationId = await getOrgAndCheck()
    const [paymentAgg, pendingAgg] = await Promise.all([
      getPaymentAgg(organizationId),
      getPendingAgg(organizationId),
    ])
    const paid = Math.round(Number(paymentAgg._sum?.amount || 0))
    const pending = Math.round(Number(pendingAgg._sum.remainingAmount || 0))
    return { paid, pending }
  }

  // ── fetchRecentCommandesSection replica (S1 consumer) ──
  const fetchRecentCommandesSection = async () => {
    const organizationId = await getOrgAndCheck()
    const rows = await getRecentCommandes(organizationId)
    return rows.map((c) => ({
      id: c.id,
      number: c.number || c.id.slice(0, 8),
      clientName: c.client?.name || 'Client',
      date: c.createdAt,
      total: Number(c.totalAmount),
      status: c.status,
    }))
  }

  // ── fetchSidebarSection replica (S1 consumer, fallback uses id/number/createdAt) ──
  const fetchSidebarSection = async () => {
    const organizationId = await getOrgAndCheck()
    const recentCommandes = await getRecentCommandes(organizationId)
    const activity: Array<{ who: string; action: string; target: string; time: string; financial: boolean }> = []
    for (const c of recentCommandes) {
      activity.push({
        who: 'Système',
        action: 'a créé la commande',
        target: c.number || c.id.slice(0, 8),
        time: 'il y a 1h',
        financial: false,
      })
    }
    return { recentCommandes, activity }
  }

  return {
    state,
    fetchKpiSection,
    fetchRevenueChartSection,
    fetchBusinessHealthSection,
    fetchPaymentsSection,
    fetchRecentCommandesSection,
    fetchSidebarSection,
  }
}

function makeData(org: string): FixtureData {
  void org
  return {
    paymentRows: [
      { amount: 1000, createdAt: new Date(2026, 7, 1, 10, 0, 0, 0) },
      { amount: 2500, createdAt: new Date(2026, 7, 15, 12, 0, 0, 0) },
      { amount: 500, createdAt: new Date(2026, 8, 1, 9, 0, 0, 0) },
    ],
    paymentSum: 4000,
    pendingSum: 1200,
    commandes: [
      {
        id: 'cmd_5', number: 'CMD-005', createdAt: new Date(2026, 8, 15, 11, 0, 0, 0),
        totalAmount: 3000, status: 'CONFIRMED', client: { name: 'Client C' },
      },
      {
        id: 'cmd_4', number: 'CMD-004', createdAt: new Date(2026, 8, 14, 10, 0, 0, 0),
        totalAmount: 2500, status: 'IN_PROGRESS', client: { name: 'Client B' },
      },
      {
        id: 'cmd_3', number: 'CMD-003', createdAt: new Date(2026, 8, 13, 9, 0, 0, 0),
        totalAmount: 1500, status: 'CONFIRMED', client: null,
      },
    ],
  }
}

function countCalls(log: PrismaCall[], method: string): number {
  return log.filter((c) => c.method === method).length
}

function isRecentCommandesCall(call: PrismaCall): boolean {
  if (call.method !== 'commande.findMany') return false
  return call.args.take === 5 &&
    call.args.orderBy?.createdAt === 'desc' &&
    Boolean(call.args.select?.client) &&
    Boolean(call.args.select?.totalAmount)
}

// ── C1: completed payment rows deduplicated ──

describe('B-06 C1: completed payment rows fetched ONCE per request', () => {
  it('KPI + RevenueChart + BusinessHealth share one payment.findMany call', async () => {
    const log: PrismaCall[] = []
    const req = makeRequest({ org: 'org_dash', cacheEnabled: true, data: makeData('org_dash'), log })

    await Promise.all([
      req.fetchKpiSection(),
      req.fetchRevenueChartSection(),
      req.fetchBusinessHealthSection(),
    ])

    assert.equal(countCalls(log, 'payment.findMany'), 1,
      'three sections must trigger exactly ONE payment.findMany when cache() is shared')
    const call = log.find((c) => c.method === 'payment.findMany')!
    assert.equal(call.args.where?.organizationId, 'org_dash', 'org must be server-derived')
    assert.equal(call.args.where?.status, 'COMPLETED')
    const cd = call.args.where?.createdAt as { gte: Date }
    assert.ok(cd.gte instanceof Date, '24-month window kept (createdAt.gte)')
  })

  it('disabling the shared cache reproduces the pre-fix 3 calls (wiring model)', async () => {
    const log: PrismaCall[] = []
    const req = makeRequest({ org: 'org_dash', cacheEnabled: false, data: makeData('org_dash'), log })

    await Promise.all([
      req.fetchKpiSection(),
      req.fetchRevenueChartSection(),
      req.fetchBusinessHealthSection(),
    ])

    assert.equal(countCalls(log, 'payment.findMany'), 3,
      'without the shared cache each section fetches its own rows (old behaviour)')
  })

  it('rows and maps stay equivalent with or without the shared cache', async () => {
    const data = makeData('org_dash')

    const logShared: PrismaCall[] = []
    const shared = makeRequest({ org: 'org_dash', cacheEnabled: true, data, log: logShared })
    const [kpiS, chartS, healthS] = await Promise.all([
      shared.fetchKpiSection(),
      shared.fetchRevenueChartSection(),
      shared.fetchBusinessHealthSection(),
    ])

    const logDirect: PrismaCall[] = []
    const direct = makeRequest({ org: 'org_dash', cacheEnabled: false, data, log: logDirect })
    const [kpiD, chartD, healthD] = await Promise.all([
      direct.fetchKpiSection(),
      direct.fetchRevenueChartSection(),
      direct.fetchBusinessHealthSection(),
    ])

    assert.deepEqual(Object.fromEntries(kpiS.monthlyMap), Object.fromEntries(kpiD.monthlyMap),
      'KPI monthly map identical whether cached or not')
    assert.deepEqual(Object.fromEntries(kpiS.paidMonthlyMap), Object.fromEntries(kpiD.paidMonthlyMap))
    assert.deepEqual(chartS.revenueMaps, chartD.revenueMaps, 'revenue maps identical')
    assert.equal(healthS.monthlyGrowth, healthD.monthlyGrowth, 'monthly growth identical')
    assert.equal(kpiS.totalRevenue, 4000)
    assert.equal(kpiS.paymentsReceived, 4000)
  })
})

// ── C2: duplicate aggregates deduplicated ──

describe('B-06 C2: payment and pending aggregates run once per request', () => {
  it('payment.aggregate runs once across KPI and Payments', async () => {
    const log: PrismaCall[] = []
    const req = makeRequest({ org: 'org_dash', cacheEnabled: true, data: makeData('org_dash'), log })

    const [kpi, pay] = await Promise.all([req.fetchKpiSection(), req.fetchPaymentsSection()])

    assert.equal(countCalls(log, 'payment.aggregate'), 1,
      'all-time COMPLETED payment sum must be aggregated ONCE per request')
    const call = log.find((c) => c.method === 'payment.aggregate')!
    assert.equal(call.args.where?.organizationId, 'org_dash')
    assert.equal(call.args.where?.status, 'COMPLETED')
    assert.deepEqual(call.args._sum, { amount: true }, 'aggregate definition unchanged')

    assert.equal(kpi.totalRevenue, 4000, 'KPI revenue unchanged')
    assert.equal(pay.paid, 4000, 'PaymentsCard paid unchanged')
  })

  it('commande.aggregate (pending deposits) runs once across KPI and Payments', async () => {
    const log: PrismaCall[] = []
    const req = makeRequest({ org: 'org_dash', cacheEnabled: true, data: makeData('org_dash'), log })

    const [kpi, pay] = await Promise.all([req.fetchKpiSection(), req.fetchPaymentsSection()])

    assert.equal(countCalls(log, 'commande.aggregate'), 1,
      'pending-deposit commande aggregate must run ONCE per request')
    const call = log.find((c) => c.method === 'commande.aggregate')!
    assert.equal(call.args.where?.organizationId, 'org_dash')
    assert.deepEqual(call.args.where?.status, { in: ['CONFIRMED', 'IN_PROGRESS'] })
    assert.deepEqual(call.args.where?.remainingAmount, { gt: 0 })
    assert.deepEqual(call.args._sum, { remainingAmount: true })

    assert.equal(kpi.pendingDeposits, 1200, 'KPI pending deposits unchanged')
    assert.equal(pay.pending, 1200, 'PaymentsCard pending unchanged')
  })

  it('financial outputs identical with the cache disabled (no rounding drift)', async () => {
    const data = makeData('org_dash')

    const logShared: PrismaCall[] = []
    const shared = makeRequest({ org: 'org_dash', cacheEnabled: true, data, log: logShared })
    const [kpiS, payS] = await Promise.all([shared.fetchKpiSection(), shared.fetchPaymentsSection()])

    const logDirect: PrismaCall[] = []
    const direct = makeRequest({ org: 'org_dash', cacheEnabled: false, data, log: logDirect })
    const [kpiD, payD] = await Promise.all([direct.fetchKpiSection(), direct.fetchPaymentsSection()])

    assert.equal(kpiS.totalRevenue, kpiD.totalRevenue)
    assert.equal(kpiS.pendingDeposits, kpiD.pendingDeposits)
    assert.equal(payS.paid, payD.paid)
    assert.equal(payS.pending, payD.pending)
  })
})

// ── S1: recentCommandes deduplicated ──

describe('B-06 S1: recent commandes fetched once across sections', () => {
  it('RecentCommandes + Sidebar share one commande.findMany (take 5)', async () => {
    const log: PrismaCall[] = []
    const req = makeRequest({ org: 'org_dash', cacheEnabled: true, data: makeData('org_dash'), log })

    const [recent, sidebar] = await Promise.all([
      req.fetchRecentCommandesSection(),
      req.fetchSidebarSection(),
    ])

    assert.equal(log.filter(isRecentCommandesCall).length, 1,
      'recent commandes (take 5 + client) must be fetched ONCE per request')
    assert.equal(recent.length, 3)
    assert.ok(sidebar.recentCommandes.length > 0)
  })

  it('sidebar fallback-activity fields (id, number, createdAt) all remain present', async () => {
    const log: PrismaCall[] = []
    const req = makeRequest({ org: 'org_dash', cacheEnabled: true, data: makeData('org_dash'), log })

    const [, sidebar] = await Promise.all([
      req.fetchRecentCommandesSection(),
      req.fetchSidebarSection(),
    ])

    const rows = sidebar.recentCommandes as Array<{ id: string; number: string; createdAt: Date }>
    for (const r of rows) {
      assert.ok(r.id, 'sidebar needs id')
      assert.ok(r.number, 'sidebar needs number')
      assert.ok(r.createdAt instanceof Date, 'sidebar needs createdAt')
    }
  })

  it('disabling the shared cache reproduces the pre-fix 2 calls', async () => {
    const log: PrismaCall[] = []
    const req = makeRequest({ org: 'org_dash', cacheEnabled: false, data: makeData('org_dash'), log })

    await Promise.all([
      req.fetchRecentCommandesSection(),
      req.fetchSidebarSection(),
    ])

    assert.equal(log.filter(isRecentCommandesCall).length, 2,
      'without the shared cache each section fetches recent commandes itself')
  })

  it('sidebar activity targets derive from the shared rows', async () => {
    const log: PrismaCall[] = []
    const req = makeRequest({ org: 'org_dash', cacheEnabled: true, data: makeData('org_dash'), log })

    const [, sidebar] = await Promise.all([
      req.fetchRecentCommandesSection(),
      req.fetchSidebarSection(),
    ])

    assert.ok(sidebar.activity.length > 0, 'fallback activity is built from recent commandes')
    assert.ok(sidebar.activity.every((a) => typeof a.target === 'string' && a.target.length > 0))
  })
})

// ── Org scoping + RBAC / auth wiring ──

describe('B-06 org scoping and RBAC stay untouched', () => {
  it('organizationId always comes from the server-side context, never client input', async () => {
    const log: PrismaCall[] = []
    const req = makeRequest({ org: 'org_server_42', cacheEnabled: true, data: makeData('org_server_42'), log })

    await Promise.all([
      req.fetchKpiSection(),
      req.fetchPaymentsSection(),
      req.fetchRecentCommandesSection(),
      req.fetchSidebarSection(),
    ])

    const paymentCalls = log.filter((c) => c.method.startsWith('payment.'))
    const commandeCalls = log.filter((c) => c.method.startsWith('commande.'))
    for (const call of [...paymentCalls, ...commandeCalls]) {
      assert.equal(call.args.where?.organizationId, 'org_server_42',
        'every org-scoped query carries the server-derived organizationId')
    }
  })

  it('getOrgAndCheck (org resolution + assertCan) runs once per request', async () => {
    const log: PrismaCall[] = []
    const req = makeRequest({ org: 'org_dash', cacheEnabled: true, data: makeData('org_dash'), log })

    await Promise.all([
      req.fetchKpiSection(),
      req.fetchRevenueChartSection(),
      req.fetchBusinessHealthSection(),
      req.fetchPaymentsSection(),
      req.fetchRecentCommandesSection(),
      req.fetchSidebarSection(),
    ])

    assert.equal(req.state.assertCanCalls, 1,
      'RBAC check executes once per request (getOrgAndCheck is cached)')
    assert.equal(req.state.getOrgCalls, 1,
      'organizationId resolution executes once per request')
  })

  it('a different request for another tenant does not reuse the previous cache', async () => {
    const logA: PrismaCall[] = []
    const logB: PrismaCall[] = []
    const reqA = makeRequest({ org: 'org_a', cacheEnabled: true, data: makeData('org_a'), log: logA })
    const reqB = makeRequest({ org: 'org_b', cacheEnabled: true, data: makeData('org_b'), log: logB })

    await Promise.all([reqA.fetchKpiSection(), reqA.fetchPaymentsSection()])
    await Promise.all([reqB.fetchKpiSection(), reqB.fetchPaymentsSection()])

    assert.equal(countCalls(logA, 'payment.findMany'), 1)
    assert.equal(countCalls(logB, 'payment.findMany'), 1, 'each request resolves its own rows')
    const bCall = logB.find((c) => c.method === 'payment.aggregate')!
    assert.equal(bCall.args.where?.organizationId, 'org_b', 'no cross-tenant cache leakage')
  })
})