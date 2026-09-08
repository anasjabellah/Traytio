/**
 * B-07 Correctness — Old-client totalSpent drift on commande re-assignment — Unit Tests
 *
 * Verifies the fix in:
 *   - src/features/financial/recalculate-commande-balances.ts
 *        (recalculateClientTotalSpent extracted and shared by both clients)
 *   - src/features/commandes/actions/update-commande.ts
 *        (old clientId captured before update; when it changes, the OLD client's
 *         totalSpent is recalculated inside the SAME transaction as the commande
 *         update and the NEW client's recalculation)
 *
 * Definition that MUST be preserved (unchanged):
 *   client.totalSpent = SUM(commande.paidAmount)
 *                      WHERE clientId = client.id AND status NOT IN (CANCELLED)
 *
 * The replica below models the actual update flow — org checks, the org-scoped
 * `existing` read, the `client.findFirst` ownership guard and `$transaction` — so
 * a wiring bug (old-client recalc left OUT of the transaction) is detectable.
 * Same convention as tests/b01..b06: dependency-injected replica, no @clerk /
 * @prisma imports.
 *
 * Run: npx tsx tests/b07-client-total-spent.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ── In-memory rows ──

interface ClientRow {
  id: string
  organizationId: string
  totalSpent: number
}

interface CommandeRow {
  id: string
  organizationId: string
  clientId: string | null
  status: string
  totalAmount: number
  acompteAmount: number
  paidAmount: number
  remainingAmount: number
  paymentStatus: string
}

interface PaymentRow {
  id: string
  commandeId: string
  amount: number
  status: string
}

interface InvoiceRow {
  id: string
  commandeId: string
  paidAmount: number
}

interface DbState {
  clients: ClientRow[]
  commandes: CommandeRow[]
  payments: PaymentRow[]
  invoices: InvoiceRow[]
}

// ── Op log (observability of the wired transaction) ──

interface Op {
  op: string
  detail: Record<string, unknown>
}

// ── computePaymentStatus mirror (src/features/financial/compute-payment-status.ts) ──

function computePaymentStatus(paidAmount: number, totalAmount: number, acompteAmount: number): string {
  if (paidAmount >= totalAmount && totalAmount > 0) return 'PAID'
  if (acompteAmount > 0 && paidAmount >= acompteAmount) return 'DEPOSIT_PAID'
  if (paidAmount > 0) return 'PARTIALLY_PAID'
  return 'UNPAID'
}

function isCountedPayment(status: string): boolean {
  return status !== 'FAILED' && status !== 'REFUNDED'
}

// ── Fixture builder: derives a CONSISTENT starting state (as after previous recalcs) ──

interface CommandeSpec {
  id: string
  organizationId: string
  clientId: string | null
  status: string
  totalAmount: number
  acompteAmount: number
  payments: Array<{ amount: number; status: string }>
}

function buildDb(specs: {
  clients: Array<{ id: string; organizationId: string }>
  commandes: CommandeSpec[]
}): DbState {
  const db: DbState = { clients: [], commandes: [], payments: [], invoices: [] }
  for (const s of specs.commandes) {
    const paidAmount = s.payments.reduce((sum, p) => sum + (isCountedPayment(p.status) ? p.amount : 0), 0)
    db.commandes.push({
      id: s.id,
      organizationId: s.organizationId,
      clientId: s.clientId,
      status: s.status,
      totalAmount: s.totalAmount,
      acompteAmount: s.acompteAmount,
      paidAmount,
      remainingAmount: Math.max(0, s.totalAmount - paidAmount),
      paymentStatus: computePaymentStatus(paidAmount, s.totalAmount, s.acompteAmount),
    })
    s.payments.forEach((p, i) => {
      db.payments.push({ id: `${s.id}-p${i}`, commandeId: s.id, amount: p.amount, status: p.status })
    })
  }
  for (const c of specs.clients) {
    db.clients.push({
      id: c.id,
      organizationId: c.organizationId,
      totalSpent: db.commandes
        .filter((cm) => cm.clientId === c.id && cm.status !== 'CANCELLED')
        .reduce((sum, cm) => sum + cm.paidAmount, 0),
    })
  }
  return db
}

// ── Transactional tx facade over a PENDING clone ──

function cloneDb(db: DbState): DbState {
  return {
    clients: db.clients.map((r) => ({ ...r })),
    commandes: db.commandes.map((r) => ({ ...r })),
    payments: db.payments.map((r) => ({ ...r })),
    invoices: db.invoices.map((r) => ({ ...r })),
  }
}

interface TxOptions {
  failDuring?: (op: Op) => void
}

function makeTx(db: DbState, log: Op[], opts: TxOptions) {
  const record = (op: Op) => {
    log.push(op)
    if (opts.failDuring) opts.failDuring(op)
  }
  return {
    payment: {
      aggregate: (args: { where: { commandeId: string; status?: unknown }; _sum: { amount: true } }) => {
        record({ op: 'payment.aggregate', detail: { commandeId: args.where.commandeId } })
        const total = db.payments
          .filter((p) => p.commandeId === args.where.commandeId)
          .filter((p) => isCountedPayment(p.status))
          .reduce((sum, p) => sum + p.amount, 0)
        return { _sum: { amount: total } }
      },
    },
    commande: {
      findUniqueOrThrow: (args: {
        where: { id: string }
        select?: Record<string, unknown>
      }) => {
        const row = db.commandes.find((c) => c.id === args.where.id)
        if (!row) throw new Error(`P2025: commande ${args.where.id} not found`)
        record({ op: 'commande.findUniqueOrThrow', detail: { id: args.where.id } })
        return row
      },
      update: (args: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = db.commandes.find((c) => c.id === args.where.id)
        if (!row) throw new Error(`P2025: commande ${args.where.id} not found`)
        record({ op: 'commande.update', detail: { id: args.where.id, ...args.data } })
        Object.assign(row, args.data)
        return row
      },
      aggregate: (args: {
        where: { clientId: string; status: unknown }
        _sum: { paidAmount: true }
      }) => {
        record({ op: 'commande.aggregate', detail: { clientId: args.where.clientId } })
        const total = db.commandes
          .filter((c) => c.clientId === args.where.clientId && c.status !== 'CANCELLED')
          .reduce((sum, c) => sum + c.paidAmount, 0)
        return { _sum: { paidAmount: total } }
      },
    },
    client: {
      update: (args: { where: { id: string }; data: { totalSpent: number } }) => {
        const row = db.clients.find((c) => c.id === args.where.id)
        if (!row) throw new Error(`P2025: client ${args.where.id} not found`)
        record({ op: 'client.update', detail: { id: args.where.id, totalSpent: args.data.totalSpent } })
        row.totalSpent = args.data.totalSpent
        return row
      },
    },
    invoice: {
      updateMany: (args: { where: { commandeId: string }; data: { paidAmount: number } }) => {
        record({ op: 'invoice.updateMany', detail: { commandeId: args.where.commandeId, paidAmount: args.data.paidAmount } })
        for (const inv of db.invoices) {
          if (inv.commandeId === args.where.commandeId) inv.paidAmount = args.data.paidAmount
        }
      },
    },
  }
}

interface TxFacade {
  payment: ReturnType<typeof makeTx>['payment']
  commande: ReturnType<typeof makeTx>['commande']
  client: ReturnType<typeof makeTx>['client']
  invoice: ReturnType<typeof makeTx>['invoice']
}

function runTransaction(db: DbState, fn: (tx: TxFacade) => Promise<void>, opts: TxOptions = {}): Promise<Op[]> {
  const pending = cloneDb(db)
  const log: Op[] = []
  const tx = makeTx(pending, log, opts)
  return Promise.resolve(fn(tx)).then(() => {
    db.clients = pending.clients
    db.commandes = pending.commandes
    db.payments = pending.payments
    db.invoices = pending.invoices
    return log
  })
}

// ── Production helpers replicated exactly ──

async function recalculateClientTotalSpent(tx: TxFacade, clientId: string): Promise<void> {
  const clientAgg = await tx.commande.aggregate({
    where: {
      clientId,
      status: { notIn: ['CANCELLED'] },
    },
    _sum: { paidAmount: true },
  })
  const totalSpent = Number(clientAgg._sum.paidAmount ?? 0)
  await tx.client.update({
    where: { id: clientId },
    data: { totalSpent },
  })
}

async function recalculateCommandeBalances(tx: TxFacade, commandeId: string): Promise<void> {
  const aggregate = await tx.payment.aggregate({
    where: {
      commandeId,
      status: { notIn: ['FAILED', 'REFUNDED'] },
    },
    _sum: { amount: true },
  })

  const paidAmount = aggregate._sum.amount ?? 0
  const commande = await tx.commande.findUniqueOrThrow({
    where: { id: commandeId },
    select: {
      totalAmount: true,
      acompteAmount: true,
      clientId: true,
    },
  })

  const totalAmount = Number(commande.totalAmount)
  const acompteAmount = Number(commande.acompteAmount)
  const paid = Number(paidAmount)
  const remainingAmount = Math.max(0, totalAmount - paid)

  const paymentStatus = computePaymentStatus(paid, totalAmount, acompteAmount)

  await tx.commande.update({
    where: { id: commandeId },
    data: {
      paidAmount,
      remainingAmount,
      paymentStatus,
    },
  })

  await tx.invoice.updateMany({
    where: { commandeId },
    data: { paidAmount },
  })

  if (commande.clientId) {
    await recalculateClientTotalSpent(tx, commande.clientId)
  }
}

// ── THE UPDATE FLOW (faithful replica of src/features/commandes/actions/update-commande.ts) ──

interface UpdateInput {
  clientId: string | null
  status?: string
  totalAmount?: number
}

async function updateCommandeFlow(
  db: DbState,
  id: string,
  input: UpdateInput,
  opts: TxOptions = {},
): Promise<{ ok: boolean; error?: string; ops: Op[] }> {
  const existing = db.commandes.find((c) => c.id === id)
  if (!existing) return { ok: false, error: 'NOT_FOUND_OR_ACCESS_DENIED', ops: [] }

  const organizationId = existing.organizationId // server-derived from the org-scoped read

  if (input.clientId != null) {
    const clientRef = db.clients.find((c) => c.id === input.clientId && c.organizationId === organizationId)
    if (!clientRef) return { ok: false, error: 'Invalid client for organization', ops: [] }
  }

  const oldClientId = existing.clientId

  let ops: Op[] = []
  try {
    ops = await runTransaction(db, async (tx) => {
      await tx.commande.update({
        where: { id },
        data: {
          clientId: input.clientId,
          status: input.status ?? existing.status,
          totalAmount: input.totalAmount ?? existing.totalAmount,
        },
      })

      await recalculateCommandeBalances(tx, id)

      if (oldClientId && oldClientId !== input.clientId) {
        await recalculateClientTotalSpent(tx, oldClientId)
      }
    }, opts)
  } catch {
    return { ok: false, error: 'TRANSACTION_FAILED', ops }
  }

  return { ok: true, ops }
}

// ── Assertion helpers ──

function clientById(db: DbState, id: string): ClientRow {
  const row = db.clients.find((c) => c.id === id)
  assert.ok(row, `client ${id} exists`)
  return row
}

function clientUpdates(log: Op[], clientId: string): number[] {
  return log
    .filter((o) => o.op === 'client.update' && o.detail.id === clientId)
    .map((o) => o.detail.totalSpent as number)
}

function totalClientUpdateOps(log: Op[]): number {
  return log.filter((o) => o.op === 'client.update').length
}

// ── A. Client A → Client B ──

describe('B-07 A: commande moves from client A to client B', () => {
  it('recalculates BOTH clients inside the same transaction', async () => {
    const db = buildDb({
      clients: [
        { id: 'client_a', organizationId: 'org_a' },
        { id: 'client_b', organizationId: 'org_a' },
      ],
      commandes: [
        {
          id: 'cmd_1', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 3000, acompteAmount: 0,
          payments: [{ amount: 1000, status: 'COMPLETED' }],
        },
        {
          id: 'cmd_2', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 2000, acompteAmount: 0,
          payments: [{ amount: 500, status: 'COMPLETED' }],
        },
      ],
    })

    assert.equal(clientById(db, 'client_a').totalSpent, 1500)
    assert.equal(clientById(db, 'client_b').totalSpent, 0)

    const res = await updateCommandeFlow(db, 'cmd_1', { clientId: 'client_b' })
    assert.equal(res.ok, true)

    assert.equal(clientById(db, 'client_a').totalSpent, 500, 'A keeps only cmd_2')
    assert.equal(clientById(db, 'client_b').totalSpent, 1000, 'B includes the moved cmd_1')
    assert.equal(db.commandes.find((c) => c.id === 'cmd_1')!.clientId, 'client_b')
  })

  it('new-client update runs first, old-client update last (after the commande is re-assigned)', async () => {
    const db = buildDb({
      clients: [
        { id: 'client_a', organizationId: 'org_a' },
        { id: 'client_b', organizationId: 'org_a' },
      ],
      commandes: [
        {
          id: 'cmd_1', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 3000, acompteAmount: 0,
          payments: [{ amount: 1000, status: 'COMPLETED' }],
        },
      ],
    })

    const res = await updateCommandeFlow(db, 'cmd_1', { clientId: 'client_b' })
    assert.equal(res.ok, true)

    const order = res.ops.filter((o) => o.op === 'client.update').map((o) => o.detail.id as string)
    assert.deepEqual(order, ['client_b', 'client_a'],
      'recalcs are wired into the transaction: new client then old client')
  })

  it('old-client totalSpent is derived AFTER the reassignment (commande no longer in A)', async () => {
    const db = buildDb({
      clients: [
        { id: 'client_a', organizationId: 'org_a' },
        { id: 'client_b', organizationId: 'org_a' },
      ],
      commandes: [
        {
          id: 'cmd_1', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 3000, acompteAmount: 0,
          payments: [{ amount: 1000, status: 'COMPLETED' }],
        },
        {
          id: 'cmd_2', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 2000, acompteAmount: 0,
          payments: [{ amount: 500, status: 'COMPLETED' }],
        },
      ],
    })

    const res = await updateCommandeFlow(db, 'cmd_1', { clientId: 'client_b' })
    assert.equal(res.ok, true)

    const aUpdates = clientUpdates(res.ops, 'client_a')
    assert.deepEqual(aUpdates, [500], 'old client recomputed once, excluding the moved commande')
  })
})

// ── B. Client A → null ──

describe('B-07 B: commande unlinked from client A (clientId → null)', () => {
  it('decrements A; the commande counts toward no client', async () => {
    const db = buildDb({
      clients: [
        { id: 'client_a', organizationId: 'org_a' },
      ],
      commandes: [
        {
          id: 'cmd_1', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 3000, acompteAmount: 0,
          payments: [{ amount: 1000, status: 'COMPLETED' }],
        },
        {
          id: 'cmd_2', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 2000, acompteAmount: 0,
          payments: [{ amount: 500, status: 'COMPLETED' }],
        },
      ],
    })

    const res = await updateCommandeFlow(db, 'cmd_1', { clientId: null })
    assert.equal(res.ok, true)

    assert.equal(clientById(db, 'client_a').totalSpent, 500, 'cmd_1 no longer counted for A')
    assert.equal(db.commandes.find((c) => c.id === 'cmd_1')!.clientId, null)
  })
})

// ── C. null → Client B ──

describe('B-07 C: commande linked to client B from unassigned state', () => {
  it('recalculates B via the existing commande-balance path; no old-client recalc', async () => {
    const db = buildDb({
      clients: [
        { id: 'client_b', organizationId: 'org_a' },
      ],
      commandes: [
        {
          id: 'cmd_1', organizationId: 'org_a', clientId: null, status: 'CONFIRMED',
          totalAmount: 3000, acompteAmount: 0,
          payments: [{ amount: 1000, status: 'COMPLETED' }],
        },
        {
          id: 'cmd_3', organizationId: 'org_a', clientId: 'client_b', status: 'CONFIRMED',
          totalAmount: 2000, acompteAmount: 0,
          payments: [{ amount: 300, status: 'COMPLETED' }],
        },
      ],
    })

    assert.equal(clientById(db, 'client_b').totalSpent, 300)

    const res = await updateCommandeFlow(db, 'cmd_1', { clientId: 'client_b' })
    assert.equal(res.ok, true)

    assert.equal(clientById(db, 'client_b').totalSpent, 1300, 'B includes the newly-linked cmd_1')
    assert.equal(totalClientUpdateOps(res.ops), 1, 'only B recalculated (no old client to fix)')
    assert.deepEqual(clientUpdates(res.ops, 'client_b'), [1300])
  })
})

// ── D. Client unchanged ──

describe('B-07 D: clientId unchanged — no unnecessary recalc', () => {
  it('performs exactly the single existing recalculation, no old-client pass', async () => {
    const db = buildDb({
      clients: [
        { id: 'client_a', organizationId: 'org_a' },
      ],
      commandes: [
        {
          id: 'cmd_1', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 3000, acompteAmount: 0,
          payments: [{ amount: 1000, status: 'COMPLETED' }],
        },
        {
          id: 'cmd_2', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 2000, acompteAmount: 0,
          payments: [{ amount: 500, status: 'COMPLETED' }],
        },
      ],
    })

    const res = await updateCommandeFlow(db, 'cmd_1', { clientId: 'client_a', totalAmount: 4000 })
    assert.equal(res.ok, true)

    assert.equal(clientById(db, 'client_a').totalSpent, 1500, 'A unchanged')
    assert.equal(totalClientUpdateOps(res.ops), 1, 'only the existing single client recalc runs')
    assert.deepEqual(clientUpdates(res.ops, 'client_a'), [1500])
  })

  it('old-client guard never fires when the client references are identical', async () => {
    const db = buildDb({
      clients: [
        { id: 'client_a', organizationId: 'org_a' },
      ],
      commandes: [
        {
          id: 'cmd_1', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 3000, acompteAmount: 0,
          payments: [{ amount: 1000, status: 'COMPLETED' }],
        },
      ],
    })

    const res = await updateCommandeFlow(db, 'cmd_1', { clientId: 'client_a' })
    assert.equal(res.ok, true)
    assert.equal(totalClientUpdateOps(res.ops), 1)
    assert.deepEqual(clientUpdates(res.ops, 'client_a'), [1000])
  })
})

// ── E. Multiple commandes incl. CANCELLED exclusion ──

describe('B-07 E: aggregates across the old client remaining commandes', () => {
  it('excludes CANCELLED from both clients; moved paidAmount lands on B', async () => {
    const db = buildDb({
      clients: [
        { id: 'client_a', organizationId: 'org_a' },
        { id: 'client_b', organizationId: 'org_a' },
      ],
      commandes: [
        {
          id: 'cmd_1', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 3000, acompteAmount: 0,
          payments: [{ amount: 1000, status: 'COMPLETED' }],
        },
        {
          id: 'cmd_2', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 2000, acompteAmount: 0,
          payments: [{ amount: 500, status: 'COMPLETED' }],
        },
        {
          id: 'cmd_4', organizationId: 'org_a', clientId: 'client_a', status: 'CANCELLED',
          totalAmount: 5000, acompteAmount: 0,
          payments: [{ amount: 800, status: 'COMPLETED' }],
        },
        {
          id: 'cmd_5', organizationId: 'org_a', clientId: 'client_b', status: 'CANCELLED',
          totalAmount: 4000, acompteAmount: 0,
          payments: [{ amount: 999, status: 'COMPLETED' }],
        },
      ],
    })

    assert.equal(clientById(db, 'client_a').totalSpent, 1500, 'baseline: CANCELLED cmd_4 excluded')
    assert.equal(clientById(db, 'client_b').totalSpent, 0, 'baseline: CANCELLED cmd_5 excluded')

    const res = await updateCommandeFlow(db, 'cmd_1', { clientId: 'client_b' })
    assert.equal(res.ok, true)

    assert.equal(clientById(db, 'client_a').totalSpent, 500, 'A = cmd_2 only')
    assert.equal(clientById(db, 'client_b').totalSpent, 1000, 'B = moved cmd_1 only')
    assert.deepEqual(clientUpdates(res.ops, 'client_a'), [500])
    assert.deepEqual(clientUpdates(res.ops, 'client_b'), [1000])
  })
})

// ── F. Organization isolation ──

describe('B-07 F: tenant isolation preserved', () => {
  it('old-client recalc never touches clients of another organization', async () => {
    const db = buildDb({
      clients: [
        { id: 'client_a', organizationId: 'org_a' },
        { id: 'client_b', organizationId: 'org_a' },
        { id: 'client_z', organizationId: 'org_b' },
      ],
      commandes: [
        {
          id: 'cmd_1', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 3000, acompteAmount: 0,
          payments: [{ amount: 1000, status: 'COMPLETED' }],
        },
        {
          id: 'cmd_z1', organizationId: 'org_b', clientId: 'client_z', status: 'CONFIRMED',
          totalAmount: 5000, acompteAmount: 0,
          payments: [{ amount: 2500, status: 'COMPLETED' }],
        },
      ],
    })

    const res = await updateCommandeFlow(db, 'cmd_1', { clientId: 'client_b' })
    assert.equal(res.ok, true)

    assert.equal(clientById(db, 'client_z').totalSpent, 2500, 'org_b client untouched')
    const updatedIds = res.ops.filter((o) => o.op === 'client.update').map((o) => o.detail.id as string)
    assert.deepEqual(updatedIds, ['client_b', 'client_a'], 'only org_a clients updated')
  })

  it('rejects a destination client that belongs to another organization, no writes', async () => {
    const db = buildDb({
      clients: [
        { id: 'client_a', organizationId: 'org_a' },
      ],
      commandes: [
        {
          id: 'cmd_1', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 3000, acompteAmount: 0,
          payments: [{ amount: 1000, status: 'COMPLETED' }],
        },
      ],
    })
    db.clients.push({ id: 'client_z', organizationId: 'org_b', totalSpent: 500 })

    const res = await updateCommandeFlow(db, 'cmd_1', { clientId: 'client_z' })
    assert.equal(res.ok, false)
    assert.equal(res.error, 'Invalid client for organization')
    assert.deepEqual(res.ops, [], 'ownership guard rejects before any transaction work')
    assert.equal(clientById(db, 'client_a').totalSpent, 1000)
    assert.equal(db.commandes.find((c) => c.id === 'cmd_1')!.clientId, 'client_a')
  })

  it('organizationId is always server-derived (existing row), never from input', async () => {
    const db = buildDb({
      clients: [
        { id: 'client_a', organizationId: 'org_a' },
        { id: 'client_b', organizationId: 'org_a' },
      ],
      commandes: [
        {
          id: 'cmd_1', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 3000, acompteAmount: 0,
          payments: [{ amount: 1000, status: 'COMPLETED' }],
        },
      ],
    })

    const res = await updateCommandeFlow(db, 'cmd_1', { clientId: 'client_b' })
    assert.equal(res.ok, true)
    const commandeAggs = res.ops.filter((o) => o.op === 'commande.aggregate')
    assert.equal(commandeAggs.length, 2, 'both clients aggregated')
    for (const agg of commandeAggs) {
      const clientId = agg.detail.clientId as string
      assert.ok(['client_a', 'client_b'].includes(clientId), 'aggregations target org_a clients only')
    }
  })
})

// ── G. Transaction atomicity ──

describe('B-07 G: totalSpent updates are atomic with the commande update', () => {
  it('failure during the old-client recalc rolls back every totalSpent change', async () => {
    const db = buildDb({
      clients: [
        { id: 'client_a', organizationId: 'org_a' },
        { id: 'client_b', organizationId: 'org_a' },
      ],
      commandes: [
        {
          id: 'cmd_1', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 3000, acompteAmount: 0,
          payments: [{ amount: 1000, status: 'COMPLETED' }],
        },
        {
          id: 'cmd_2', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 2000, acompteAmount: 0,
          payments: [{ amount: 500, status: 'COMPLETED' }],
        },
      ],
    })

    const res = await updateCommandeFlow(db, 'cmd_1', { clientId: 'client_b' }, {
      failDuring: (op) => {
        if (op.op === 'client.update' && op.detail.id === 'client_a') {
          throw new Error('simulated DB failure on old-client totalSpent write')
        }
      },
    })

    assert.equal(res.ok, false)
    assert.equal(res.error, 'TRANSACTION_FAILED')
    assert.equal(db.commandes.find((c) => c.id === 'cmd_1')!.clientId, 'client_a')
    assert.equal(clientById(db, 'client_a').totalSpent, 1500, 'A unchanged after rollback')
    assert.equal(clientById(db, 'client_b').totalSpent, 0, 'B no partial state persisted')
  })

  it('failure during the new-client recalc rolls back the old-client update too', async () => {
    const db = buildDb({
      clients: [
        { id: 'client_a', organizationId: 'org_a' },
        { id: 'client_b', organizationId: 'org_a' },
      ],
      commandes: [
        {
          id: 'cmd_1', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 3000, acompteAmount: 0,
          payments: [{ amount: 1000, status: 'COMPLETED' }],
        },
      ],
    })

    const res = await updateCommandeFlow(db, 'cmd_1', { clientId: 'client_b' }, {
      failDuring: (op) => {
        if (op.op === 'client.update' && op.detail.id === 'client_b') {
          throw new Error('simulated DB failure on new-client totalSpent write')
        }
      },
    })

    assert.equal(res.ok, false)
    assert.equal(db.commandes.find((c) => c.id === 'cmd_1')!.clientId, 'client_a')
    assert.equal(clientById(db, 'client_a').totalSpent, 1000)
    assert.equal(clientById(db, 'client_b').totalSpent, 0)
  })

  it('nothing persists when the commande update itself fails', async () => {
    const db = buildDb({
      clients: [
        { id: 'client_a', organizationId: 'org_a' },
      ],
      commandes: [
        {
          id: 'cmd_1', organizationId: 'org_a', clientId: 'client_a', status: 'CONFIRMED',
          totalAmount: 3000, acompteAmount: 0,
          payments: [{ amount: 1000, status: 'COMPLETED' }],
        },
      ],
    })

    const res = await updateCommandeFlow(db, 'cmd_1', { clientId: 'client_a' }, {
      failDuring: (op) => {
        if (op.op === 'commande.update') throw new Error('simulated DB failure on commande update')
      },
    })

    assert.equal(res.ok, false)
    assert.equal(db.commandes.find((c) => c.id === 'cmd_1')!.clientId, 'client_a')
    assert.equal(clientById(db, 'client_a').totalSpent, 1000)
  })
})