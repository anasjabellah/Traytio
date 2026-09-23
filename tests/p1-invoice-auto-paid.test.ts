/**
 * P1-1: invoice status auto-sync on full payment.
 *
 * Root cause: recalculateCommandeBalances synced only paidAmount to linked
 * invoices; nothing ever moved invoice.status, so paid commandes left
 * invoices stuck in DRAFT/SENT.
 *
 * Rule (forward-only, server-side, inside the callers' transaction):
 * remaining == 0 && total > 0 && status in [DRAFT,SENT,VIEWED,ACCEPTED,
 * OVERDUE] → PAID. PAID never regresses (terminal domain rule; manual and
 * auto PAID are indistinguishable, so reversal only re-syncs paidAmount).
 * REJECTED is excluded (explicit business decision stays manual).
 *
 * Conventions: dependency-injected replica + fs source-contract checks —
 * no @clerk/@prisma imports, no DB.
 *
 * Run: npx tsx tests/p1-invoice-auto-paid.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')
const read = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf8')

// ── Types ──────────────────────────────────────────────────────────

type InvoiceStatus =
  | 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED'
  | 'REJECTED' | 'PAID' | 'OVERDUE'

interface InvoiceRow {
  id: string
  commandeId: string
  organizationId: string
  status: InvoiceStatus
  paidAmount: number
}

interface CommandeState {
  id: string
  organizationId: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
}

// ── Replica (mirrors recalculateCommandeBalances + auto-PAID guard) ─

const AUTO_PAID_FROM: InvoiceStatus[] = ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'OVERDUE']

function recalculate(
  invoices: InvoiceRow[],
  commande: CommandeState,
  paymentTotal: number,
): CommandeState {
  const paid = paymentTotal
  const remaining = Math.max(0, commande.totalAmount - paid)
  const next = { ...commande, paidAmount: paid, remainingAmount: remaining }
  for (const inv of invoices) {
    if (inv.commandeId !== commande.id || inv.organizationId !== commande.organizationId) continue
    inv.paidAmount = paid
    if (remaining === 0 && commande.totalAmount > 0 && AUTO_PAID_FROM.includes(inv.status)) {
      inv.status = 'PAID'
    }
  }
  return next
}

function fixture(
  total: number,
  invoiceStatuses: InvoiceStatus[] = ['DRAFT'],
  org = 'org_a',
  cmdId = 'cmd_1',
): { invoices: InvoiceRow[]; commande: CommandeState } {
  return {
    invoices: invoiceStatuses.map((status, i) => ({
      id: `inv_${i}`, commandeId: cmdId, organizationId: org,
      status, paidAmount: 0,
    })),
    commande: {
      id: cmdId, organizationId: org,
      totalAmount: total, paidAmount: 0, remainingAmount: total,
    },
  }
}

// ── Tests 1–5: forward sync ────────────────────────────────────────

describe('P1-1 BEHAVIOR: auto-PAID on full payment', () => {
  it('Test 1 — full payment: remaining 0 and invoice PAID', () => {
    const { invoices, commande } = fixture(10000)
    const next = recalculate(invoices, commande, 10000)
    assert.equal(next.remainingAmount, 0)
    assert.equal(invoices[0]!.status, 'PAID')
    assert.equal(invoices[0]!.paidAmount, 10000)
  })

  it('Test 2 — partial payment (5000/10000): invoice NOT PAID', () => {
    const { invoices, commande } = fixture(10000)
    const next = recalculate(invoices, commande, 5000)
    assert.equal(next.remainingAmount, 5000)
    assert.equal(invoices[0]!.status, 'DRAFT')
  })

  it('Test 3 — 3000+4000+3000: PAID only after the final payment', () => {
    const { invoices, commande } = fixture(10000)
    let state = commande
    state = recalculate(invoices, state, 3000)
    assert.equal(invoices[0]!.status, 'DRAFT')
    state = recalculate(invoices, state, 7000)
    assert.equal(invoices[0]!.status, 'DRAFT')
    state = recalculate(invoices, state, 10000)
    assert.equal(state.remainingAmount, 0)
    assert.equal(invoices[0]!.status, 'PAID')
  })

  it('Test 4 — SENT invoice becomes PAID on full payment', () => {
    const { invoices, commande } = fixture(10000, ['SENT'])
    recalculate(invoices, commande, 10000)
    assert.equal(invoices[0]!.status, 'PAID')
  })

  it('Test 5 — DRAFT/VIEWED/ACCEPTED/OVERDUE all transition; REJECTED never does', () => {
    for (const from of ['DRAFT', 'VIEWED', 'ACCEPTED', 'OVERDUE'] as InvoiceStatus[]) {
      const { invoices, commande } = fixture(100, [from])
      recalculate(invoices, commande, 100)
      assert.equal(invoices[0]!.status, 'PAID', `${from} → PAID`)
    }
    const rej = fixture(100, ['REJECTED'])
    recalculate(rej.invoices, rej.commande, 100)
    assert.equal(rej.invoices[0]!.status, 'REJECTED', 'explicit rejection wins')
  })

  it('zero-total commande never auto-flips (guard totalAmount > 0)', () => {
    const { invoices, commande } = fixture(0)
    recalculate(invoices, commande, 0)
    assert.equal(invoices[0]!.status, 'DRAFT')
  })
})

// ── Tests 6–8: reversal, isolation, permissions ────────────────────

describe('P1-1 BEHAVIOR: reversal, isolation, permissions', () => {
  it('Test 6 — reversal does NOT regress PAID (terminal rule), paidAmount still syncs', () => {
    const { invoices, commande } = fixture(10000)
    let state = recalculate(invoices, commande, 10000)
    assert.equal(invoices[0]!.status, 'PAID')
    // Payment deleted → money back out; status stays PAID per domain rule.
    state = recalculate(invoices, state, 4000)
    assert.equal(state.remainingAmount, 6000)
    assert.equal(invoices[0]!.status, 'PAID', 'no auto-regress (documented)')
    assert.equal(invoices[0]!.paidAmount, 4000, 'paidAmount still re-syncs')
  })

  it('Test 7 — tenant isolation: other-org invoices untouched', () => {
    const { invoices, commande } = fixture(10000, ['DRAFT', 'DRAFT'])
    invoices[1]!.organizationId = 'org_b'
    invoices[1]!.commandeId = 'cmd_other'
    const foreign = fixture(10000, ['DRAFT'], 'org_b', 'cmd_other')
    const all = [...invoices, ...foreign.invoices]
    recalculate(all, commande, 10000)
    assert.equal(all[0]!.status, 'PAID')
    assert.equal(all[1]!.status, 'DRAFT', 'foreign commande link untouched')
    assert.equal(all[2]!.status, 'DRAFT', 'foreign org untouched')
  })

  it('Test 8 — no RBAC surface added (sync rides the caller action)', () => {
    const src = read('features/financial/recalculate-commande-balances.ts')
    assert.ok(!src.includes('assertCan'), 'no new authz gate inside the helper')
    assert.ok(!src.includes('getCurrentMembership'), 'no identity lookup inside the helper')
  })
})

// ── Source contracts ───────────────────────────────────────────────

describe('P1-1 SOURCE CONTRACT', () => {
  it('auto-PAID lives inside the callers’ transaction in recalculateCommandeBalances', () => {
    const src = read('features/financial/recalculate-commande-balances.ts')
    assert.ok(src.includes("data: { status: 'PAID' }"), 'writes PAID')
    assert.ok(src.includes("'DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'OVERDUE'"), 'eligible statuses enumerated')
    assert.ok(src.includes('remainingAmount === 0 && totalAmount > 0'), 'full-payment guard with zero-total exclusion')
    const runIdx = src.indexOf('const run = async')
    const paidIdx = src.indexOf('Sync paidAmount')
    const autoIdx = src.indexOf('Auto-PAID')
    assert.ok(runIdx !== -1 && paidIdx > runIdx && autoIdx > paidIdx, 'sync runs inside run(), after paidAmount')
  })

  it('all balance-mutating callers route through the helper in a transaction', () => {
    for (const f of [
      'features/payments/actions/record-payment.ts',
      'features/payments/actions/delete-payment.ts',
      'features/commandes/actions/create-commande.ts',
      'features/commandes/actions/update-commande.ts',
    ]) {
      const src = read(f)
      assert.ok(src.includes('recalculateCommandeBalances'), `${f} recalculates balances`)
    }
    const record = read('features/payments/actions/record-payment.ts')
    assert.ok(record.includes('FOR UPDATE'), 'concurrent-payment serialization preserved')
  })

  it('manual PAID-terminal rule still intact', () => {
    const src = read('features/invoices/actions/invoice-actions.ts')
    assert.ok(
      src.includes('existing.status === "PAID" && parsed.data.status !== "PAID"'),
      'manual regress-guard untouched',
    )
  })
})
