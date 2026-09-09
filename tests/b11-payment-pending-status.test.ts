/**
 * B-11 Financial Integrity — Dead PENDING payment analytics — Unit Tests
 *
 * Finding F-9: the payments dashboard aggregated and displayed a PENDING
 * count/amount even though no legitimate workflow can ever produce a PENDING
 * payment, making the statistic dead/misleading.
 *
 * Actual payment lifecycle (verified here against the source):
 *   - src/features/payments/actions/record-payment.ts creates payments with a
 *     hard-coded `status: "COMPLETED"` — the ONLY status write in the module.
 *   - There is NO `payment.update` / `updateMany` anywhere in
 *     src/features/payments, so a payment can never transition away from
 *     COMPLETED after creation.
 *   - delete-payment.ts only removes payments and recomputes commande balances.
 *   - Therefore PENDING (and FAILED/REFUNDED) are unreachable states.
 *
 * Fix: the payments dashboard stops reading, rendering, or filtering PENDING.
 * get-payments.ts sums only COMPLETED/REFUNDED groups; the PENDING KPI card,
 * subtitle, insight, sparkline, quick-stat and status-filter entry were removed;
 * STATUS_LABELS/STATUS_STYLES in constants.ts no longer map PENDING.
 *
 * These tests:
 *   1. mirror the new aggregation invariants (supported-status whitelist,
 *      payment rate, no pending contribution) so any regression re-introducing
 *      PENDING math fails,
 *   2. contract-check the actual source tree (fs only — no transitive deps):
 *      payments can only be created as COMPLETED, no update path exists, and the
 *      whole payments dashboard surface is free of stale PENDING references,
 *   3. guard the legitimately invoice-based "pending payment" analytics in
 *      get-invoice-stats.ts, which is intentionally untouched by this fix.
 *
 * Run: npx tsx tests/b11-payment-pending-status.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

// ── fs helpers (no imports of app modules) ──

function readProjectFile(rel: string): string {
  return readFileSync(path.join(ROOT, rel), 'utf8')
}

function collectFiles(relDir: string): string[] {
  const abs = path.join(ROOT, relDir)
  const out: string[] = []
  for (const entry of readdirSync(abs)) {
    const full = path.join(abs, entry)
    if (statSync(full).isDirectory()) {
      out.push(...collectFiles(path.join(relDir, entry)))
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(path.join(relDir, entry))
    }
  }
  return out
}

// ── Aggregation invariants (faithful replicas of the fixed get-payments.ts) ──

/** Mirrors get-payments.ts: the summary groupBy reads only these statuses. */
const SUMMARY_STATUSES = ['COMPLETED', 'REFUNDED'] as const

/** Mirrors the groupBy whitelist applied to raw status groups (a hypothetical PENDING row included). */
function summarizeStatusGroups(groups: Array<{ status: string; _count: number; _sum: { amount: number } | null }>) {
  return groups
    .filter(g => (SUMMARY_STATUSES as readonly string[]).includes(g.status))
    .map(g => ({ status: g.status, count: g._count, total: g._sum?.amount ?? 0 }))
    .sort((a, b) => a.status.localeCompare(b.status))
}

/** Mirrors get-payments.ts: paymentRate = completed / (completed + refunded), 0 when empty. */
function paymentRate(completedCount: number, refundedCount: number): number {
  const total = completedCount + refundedCount
  return total > 0 ? Math.round((completedCount / total) * 100) : 0
}

describe('B-11 payment lifecycle: no PENDING creation path', () => {
  it('record-payment writes exactly one status and it is COMPLETED', () => {
    const src = readProjectFile('src/features/payments/actions/record-payment.ts')
    const statusWrites = [...src.matchAll(/\bstatus\s*:\s*"([A-Z_]+)"/g)].map(m => m[1])
    assert.deepEqual(statusWrites, ['COMPLETED'], 'the only status write must be COMPLETED')
    assert.ok(!src.includes('PENDING'), 'record-payment must not reference PENDING at all')
  })

  it('no payment update/updateMany path exists anywhere in the payments feature', () => {
    const files = collectFiles('src/features/payments')
    const combined = files.map(f => readProjectFile(f)).join('\n')
    assert.equal(combined.includes('payment.update'), false, 'no payment.update is allowed (no status transition path)')
    assert.equal(combined.includes('updateMany'), false, 'no updateMany is allowed in the payments feature')
    assert.ok(combined.includes('payment.create'), 'payments can still be created')
    assert.ok(combined.includes('payment.delete'), 'payments can still be deleted')
  })

  it('creating/deleting payments still recomputes commande balances (financial semantics intact)', () => {
    const files = collectFiles('src/features/payments')
    const combined = files.map(f => readProjectFile(f)).join('\n')
    const occurrences = combined.split('recalculateCommandeBalances').length - 1
    assert.ok(occurrences >= 2, `record + delete must both call recalculateCommandeBalances (found ${occurrences})`)
  })
})

describe('B-11 aggregation invariants: PENDING absent from payments analytics', () => {
  it('the summary only aggregates COMPLETED and REFUNDED groups', () => {
    const summary = summarizeStatusGroups([
      { status: 'COMPLETED', _count: 10, _sum: { amount: 1000 } },
      { status: 'REFUNDED', _count: 2, _sum: { amount: 200 } },
      { status: 'PENDING', _count: 99, _sum: { amount: 9999 } },
    ])
    assert.equal(summary.length, 2)
    assert.equal(summary.some(g => g.status === 'PENDING'), false)
  })

  it('a hypothetical PENDING row contributes nothing to collected/refunded totals', () => {
    const summary = summarizeStatusGroups([
      { status: 'COMPLETED', _count: 10, _sum: { amount: 1000 } },
      { status: 'REFUNDED', _count: 2, _sum: { amount: 200 } },
      { status: 'PENDING', _count: 5, _sum: { amount: 500 } },
    ])
    const total = summary.reduce((s, g) => s + g.total, 0)
    const count = summary.reduce((s, g) => s + g.count, 0)
    assert.equal(total, 1200, 'pending amount must never leak into payments analytics')
    assert.equal(count, 12)
  })

  it('payment rate never counts pending payments', () => {
    assert.equal(paymentRate(10, 2), 83)
    assert.equal(paymentRate(0, 0), 0)
    assert.equal(paymentRate(0, 5), 0)
  })
})

describe('B-11 dashboard surface: no stale PENDING references remain', () => {
  it('the payments dashboard source tree is free of PENDING analytics/UI', () => {
    const files = [
      ...collectFiles('src/features/payments'),
      ...collectFiles('src/app/dashboard/payments'),
    ]
    const combined = files.map(f => readProjectFile(f)).join('\n')
    for (const token of ['pendingCount', 'perfPending', 'PENDING', 'En attente', 'en attente de validation']) {
      assert.equal(combined.includes(token), false, `token ${JSON.stringify(token)} must not appear in the payments dashboard surface`)
    }
  })

  it('PaymentStats no longer exposes pending fields', () => {
    const types = readProjectFile('src/features/payments/types/index.ts')
    assert.ok(!types.includes('pendingCount'))
    assert.ok(!types.includes('perfPending'))
    assert.ok(types.includes('refundedCount'), 'refunded analytics remain untouched')
  })

  it('invoice-based pending-payment analytics stay intact (not part of this finding)', () => {
    const inv = readProjectFile('src/features/invoices/lib/get-invoice-stats.ts')
    assert.ok(inv.includes('pendingPaymentGroups'), 'invoice payment-progress grouping must remain')
    assert.ok(inv.includes("'En attente'"), 'invoice awaiting-payment label must remain')
  })
})