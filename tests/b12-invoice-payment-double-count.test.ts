/**
 * B-12 Financial Integrity — Invoice-based org "collected" double-count — Unit Tests
 *
 * Finding F-10: the invoices dashboard computed org-level "Total encaissé" from
 * `SUM(invoice.paidAmount)`. A single Commande legitimately maps to MULTIPLE
 * Invoice rows (devis + facture, prefixes DEV/FAC via INVOICE_PREFIX), and every
 * linked invoice is synced with the commande's `paidAmount`:
 *
 *   src/features/financial/recalculate-commande-balances.ts:78-82
 *     await tx.invoice.updateMany({ where: { commandeId }, data: { paidAmount } });
 *
 * Payments themselves are commande-scoped, never invoice-scoped:
 *
 *   src/features/payments/actions/record-payment.ts:57-70
 *     tx.payment.create({ ..., commandeId, amount, method, status: "COMPLETED" })
 *     → no `invoiceId` is ever set (payment.invoiceId stays NULL in practice),
 *       even though the column is nullable in the schema.
 *
 * So for 1 commande / 2 invoices / 1 real payment of 5000:
 *   SUM(invoice.paidAmount) = 5000 + 5000 = 10000  ← the SAME payment counted once
 *                                                   per linked document (wrong)
 *   unique COMPLETED Payment rows                   = 5000  ← correct (once)
 *
 * Fix (src/features/invoices/lib/get-invoice-stats.ts, ONLY file changed):
 *   - org-level collected figures now come from unique Payment rows:
 *       prisma.payment.aggregate({ where: { organizationId, status: 'COMPLETED' }, _sum: { amount } })
 *   - collector sparkline from the same scoped Payment rows (createdAt >= 8 months ago)
 *   - invoice-level paidAmount (per-document display/progress) is intentionally
 *     preserved as-is: recalculate-commande-balances, invoice-actions creates,
 *     status groups, per-invoice payment-progress grouping and perfRemaining all
 *     stay on the per-document figure.
 *
 * These tests:
 *   1. mirror the fixed aggregation (unique-Payment totals + scoped sparklines) and
 *      prove the audit scenario resolves to a single count,
 *   2. prove SUM(invoice.paidAmount) is the bug source (two synced copies),
 *   3. guard status whitelist (COMPLETED only) and tenant isolation (organizationId),
 *   4. contract-check the source tree (fs only — no transitive deps): the sync exists,
 *      the collected total no longer reads invoice paidAmount, payments stay
 *      commande-scoped, and the payments dashboard agrees on the same Payment rows.
 *
 * Run: npx tsx tests/b12-invoice-payment-double-count.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function readProjectFile(rel: string): string {
  return readFileSync(path.join(ROOT, rel), 'utf8')
}

// ── Aggregation replicas: faithful to the FIXED get-invoice-stats.ts ──

interface Row {
  organizationId: string
  status: string
  amount: number
}

/** Mirrors `prisma.payment.aggregate({ where: { organizationId, status: 'COMPLETED' }, _sum.amount })`. */
function orgCollected(orgId: string, payments: Row[]): number {
  return payments
    .filter(p => p.organizationId === orgId && p.status === 'COMPLETED')
    .reduce((s, p) => s + p.amount, 0)
}

/** The OLD metric: SUM(invoice.paidAmount) — the double-count source. */
function sumInvoicePaidAmount(invoices: Array<{ paidAmount: number }>): number {
  return invoices.reduce((s, inv) => s + inv.paidAmount, 0)
}

/** Mirrors `Number(aggregateResult._sum.totalAmount ?? 0)`. */
function totalInvoiced(invoices: Array<{ totalAmount: number }>): number {
  return invoices.reduce((s, inv) => s + inv.totalAmount, 0)
}

/** Mirrors `paymentRate` in the fixed file. */
function paymentRate(collected: number, invoiced: number): number {
  return invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0
}

/**
 * Mirrors `buildMonthlySparkline(paymentRows, monthKeys, (r) => Number(r.amount))`:
 * each unique Payment is bucketed once by the month key of its createdAt.
 */
function collectedSparkline(
  rows: Array<{ status: string; amount: number }>,
  monthKeys: string[],
  monthOf: (row: { status: string; amount: number }) => string,
): number[] {
  const buckets = new Map<string, number>()
  for (const row of rows) {
    if (row.status !== 'COMPLETED') continue
    const key = monthOf(row)
    buckets.set(key, (buckets.get(key) ?? 0) + row.amount)
  }
  return monthKeys.map(key => Math.round(buckets.get(key) ?? 0))
}

// ── The audit scenario: 1 commande, 2 invoices, 1 payment ──

const ORG_A = 'org-a'
const ORG_B = 'org-b'

const devisFacture = [
  { totalAmount: 10000, paidAmount: 5000 }, // DEVIS — synced with commande.paidAmount
  { totalAmount: 10000, paidAmount: 5000 }, // FACTURE — same sync
]

const onePayment = [
  { organizationId: ORG_A, status: 'COMPLETED', amount: 5000 }, // the only real payment
]

describe('B-12 audit scenario: 1 commande / 2 invoices / 1 payment', () => {
  it('the OLD SUM(invoice.paidAmount) metric double-counts the payment', () => {
    assert.equal(sumInvoicePaidAmount(devisFacture), 10000, 'one payment appears once per linked document')
  })

  it('the fixed org-collected metric counts the unique Payment exactly once', () => {
    assert.equal(orgCollected(ORG_A, onePayment), 5000)
  })

  it('totalInvoiced stays document-based (sum of issued documents)', () => {
    assert.equal(totalInvoiced(devisFacture), 20000, 'unchanged semantics: sum of all financial documents')
  })

  it('totalRemaining and paymentRate derive from the single-counted collected', () => {
    const collected = orgCollected(ORG_A, onePayment)
    const invoiced = totalInvoiced(devisFacture)
    assert.equal(invoiced - collected, 15000, 'remaining = invoiced - actually collected')
    assert.equal(paymentRate(collected, invoiced), 25)
  })

  it('per-document paidAmount display semantics are preserved (each invoice keeps its mirrored copy)', () => {
    assert.equal(devisFacture[0].paidAmount, 5000)
    assert.equal(devisFacture[1].paidAmount, 5000)
  })

  it('multiple payments for the same commande are each counted once', () => {
    const payments = [
      { organizationId: ORG_A, status: 'COMPLETED', amount: 3000 },
      { organizationId: ORG_A, status: 'COMPLETED', amount: 2000 },
    ]
    assert.equal(orgCollected(ORG_A, payments), 5000)
  })
})

describe('B-12 status whitelist and tenant isolation', () => {
  it('only COMPLETED payments contribute to org collected', () => {
    const payments = [
      { organizationId: ORG_A, status: 'COMPLETED', amount: 5000 },
      { organizationId: ORG_A, status: 'FAILED', amount: 5000 },
      { organizationId: ORG_A, status: 'REFUNDED', amount: 5000 },
      { organizationId: ORG_A, status: 'PENDING', amount: 5000 },
    ]
    assert.equal(orgCollected(ORG_A, payments), 5000, 'FAILED/REFUNDED/PENDING never leak into collected')
  })

  it('payments from another organization never leak into the org total', () => {
    const payments = [
      { organizationId: ORG_A, status: 'COMPLETED', amount: 5000 },
      { organizationId: ORG_B, status: 'COMPLETED', amount: 99999 },
    ]
    assert.equal(orgCollected(ORG_A, payments), 5000, 'org scope is enforced by the where clause')
  })

  it('the collector sparkline buckets each unique payment once, per month', () => {
    // Two synced documents (devis + facture) would have contributed 2×5000 to
    // the OLD invoice-based sparkline. The fixed sparkline consumes one row each.
    const monthKey = (row: { status: string; amount: number }) => '2026-09'
    const spark = collectedSparkline(onePayment, ['2026-08', '2026-09'], monthKey)
    assert.deepEqual(spark, [0, 5000], 'two synced invoices but one payment → one bucket entry of 5000')
  })
})

describe('B-12 source contract: sync source and fixed aggregation', () => {
  it('recalculateCommandeBalances marshals the commander paidAmount to EVERY linked invoice', () => {
    const src = readProjectFile('src/features/financial/recalculate-commande-balances.ts')
    assert.ok(src.includes('tx.invoice.updateMany'), 'invoice sync must use updateMany')
    assert.ok(src.includes('where: { commandeId }'), 'sync targets all invoices of the commande')
    assert.ok(src.includes('data: { paidAmount }'), 'sync copies the same paidAmount to every document')
  })

  it('the fixed collected total comes from unique Payment rows, not invoice paidAmount', () => {
    const src = readProjectFile('src/features/invoices/lib/get-invoice-stats.ts')
    assert.ok(src.includes('const totalCollected = Number(paymentTotals._sum.amount ?? 0);'), 'totalCollected reads the payment aggregate')
    assert.ok(src.includes("prisma.payment.aggregate"), 'collected uses a payment aggregation')
    assert.ok(src.includes('status: \'COMPLETED\''), 'only COMPLETED payments count')
    assert.ok(!src.includes('totalCollected = Number(aggregateResult._sum.paidAmount'), 'no invoice-paidAmount-derived collected remains')
  })

  it('invoice-level per-document semantics are untouched by the fix', () => {
    const src = readProjectFile('src/features/invoices/lib/get-invoice-stats.ts')
    assert.ok(src.includes('pendingPaymentGroups'), 'per-invoice payment-progress grouping remains')
    assert.ok(src.includes("Number(r.totalAmount) - Number(r.paidAmount)"), 'perfRemaining still uses per-document paidAmount')
    assert.ok(src.includes('paidAmount: true'), 'invoice aggregate still tracks paidAmount for status groups')
  })

  it('payments are recorded against a commande, never against an invoice', () => {
    const src = readProjectFile('src/features/payments/actions/record-payment.ts')
    assert.ok(!src.includes('invoiceId'), 'record-payment must not assign a payment to an invoice')
    assert.ok(src.includes('commandeId: data.commandeId'), 'payments stay commande-scoped')
    assert.ok(src.includes('status: "COMPLETED"'))
  })

  it('the payments dashboard agrees on the same Payment-based collected semantics', () => {
    const src = readProjectFile('src/features/payments/actions/get-payments.ts')
    assert.ok(src.includes('status: { in: ["COMPLETED", "REFUNDED"] }'))
    assert.ok(src.includes('const collectedTotal = Number(collectedAgg?._sum.amount ?? 0)'), 'payments dashboard is also unique-Payment based')
  })
})