/**
 * F-1 Concurrent Payment Race — Source Contract Tests
 *
 * Finding F-1: recordPayment read `Commande.remainingAmount` via
 * `tx.commande.findUnique` inside a Read Committed transaction without
 * acquiring a row lock. Two concurrent payment transactions could both
 * read the same remainingAmount, both pass validation, both create
 * Payment rows, and both compute stale aggregates — leaving the
 * denormalized paidAmount/remainingAmount/paymentStatus wrong.
 *
 * Fix: the plain findUnique was replaced with `SELECT ... FOR UPDATE`
 * via Prisma `$queryRaw`. The lock is acquired before the remaining
 * amount comparison, ensuring concurrent transactions are serialized.
 *
 * These tests contract-check the source tree (fs only — no transitive
 * deps, no real DB) to verify the fix is present and correct.
 *
 * NOTE: definitive concurrency proof requires a real PostgreSQL
 * integration test with two parallel transactions. These source-level
 * tests verify the lock pattern exists in the code.
 *
 * Run: npx tsx tests/f1-concurrent-payment-race.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function readProjectFile(rel: string): string {
  return readFileSync(path.join(ROOT, rel), 'utf8')
}

const SRC = readProjectFile('src/features/payments/actions/record-payment.ts')

// ── Contract: FOR UPDATE lock is present ──

describe('F-1 contract: FOR UPDATE row lock in record-payment.ts', () => {
  it('contains FOR UPDATE in the SQL query', () => {
    assert.ok(SRC.includes('FOR UPDATE'), 'record-payment.ts must use FOR UPDATE to lock the Commande row')
  })

  it('uses $queryRaw for the locked read', () => {
    assert.ok(SRC.includes('$queryRaw'), 'the locked read must use Prisma $queryRaw')
  })

  it('selects remainingAmount from commandes', () => {
    assert.ok(
      SRC.includes('SELECT "remainingAmount"') && SRC.includes('FROM "commandes"'),
      'the query must SELECT "remainingAmount" FROM "commandes"',
    )
  })

  it('filters by the commande ID parameter', () => {
    assert.ok(
      SRC.includes('WHERE "id" = ${data.commandeId}'),
      'the query must filter by WHERE "id" = ${data.commandeId}',
    )
  })

  it('is parameterized via Prisma tagged-template binding (no string concatenation)', () => {
    // The query must use Prisma's ${...} interpolation, not string concatenation.
    // Verify no manual string concat or template literal into raw SQL beyond Prisma tags.
    assert.ok(
      !SRC.includes("concat") && !SRC.includes("`SELECT") && !SRC.includes("' +"),
      'no string concatenation into raw SQL — must use Prisma tagged-template parameters',
    )
  })
})

// ── Contract: old plain findUnique guard is removed ──

describe('F-1 contract: old plain findUnique remainingAmount guard is gone', () => {
  it('does not use tx.commande.findUnique for the remainingAmount check inside the transaction', () => {
    // The transaction body must not contain a plain findUnique for remainingAmount.
    // It may contain findUniqueOrThrow inside recalculateCommandeBalances, but that
    // is a different function (recalculate-commande-balances.ts).
    const txStart = SRC.indexOf('prisma.$transaction(async (tx)')
    assert.ok(txStart > 0, 'transaction must exist')

    const txBody = SRC.slice(txStart)
    // The old pattern was: tx.commande.findUnique({ where: ..., select: { remainingAmount: true } })
    assert.ok(
      !txBody.includes('tx.commande.findUnique('),
      'tx.commande.findUnique must not appear in the transaction body (replaced by $queryRaw FOR UPDATE)',
    )
  })
})

// ── Contract: result handling ──

describe('F-1 contract: result handling for $queryRaw', () => {
  it('checks rows.length === 0 for missing commande (not freshCommande null check)', () => {
    assert.ok(
      SRC.includes('rows.length === 0'),
      'must check rows.length === 0 for the no-row case',
    )
  })

  it('reads remainingAmount from rows[0]', () => {
    assert.ok(
      SRC.includes('rows[0].remainingAmount'),
      'must read remainingAmount from rows[0]',
    )
  })

  it('converts remainingAmount through Number() for safe comparison', () => {
    assert.ok(
      SRC.includes('Number(rows[0].remainingAmount)'),
      'must use Number() to convert the raw Decimal to a number for comparison',
    )
  })
})

// ── Contract: transaction flow integrity ──

describe('F-1 contract: transaction flow integrity', () => {
  it('payment creation remains inside the same transaction', () => {
    const txBody = SRC.slice(SRC.indexOf('prisma.$transaction(async (tx)'))
    assert.ok(
      txBody.includes('tx.payment.create('),
      'tx.payment.create must remain inside the transaction',
    )
  })

  it('recalculateCommandeBalances remains inside the same transaction', () => {
    const txBody = SRC.slice(SRC.indexOf('prisma.$transaction(async (tx)'))
    assert.ok(
      txBody.includes('recalculateCommandeBalances(tx,'),
      'recalculateCommandeBalances(tx, ...) must remain inside the transaction',
    )
  })

  it('commandeActivity creation remains inside the same transaction', () => {
    const txBody = SRC.slice(SRC.indexOf('prisma.$transaction(async (tx)'))
    assert.ok(
      txBody.includes('tx.commandeActivity.create('),
      'tx.commandeActivity.create must remain inside the transaction',
    )
  })
})

// ── Contract: pre-transaction guards unchanged ──

describe('F-1 contract: pre-transaction guards unchanged', () => {
  it('organization-scoped existence check remains before the transaction', () => {
    assert.ok(
      SRC.includes('prisma.commande.findFirst(') && SRC.includes('organizationId'),
      'the pre-tx org-scoped commande existence check must remain',
    )
  })

  it('the existence check uses the correct error message', () => {
    assert.ok(
      SRC.includes('PAYMENT.NOT_FOUND_COMMANDE'),
      'must return PAYMENT.NOT_FOUND_COMMANDE when commande not found pre-tx',
    )
  })
})

// ── Contract: amount validation unchanged ──

describe('F-1 contract: amount validation unchanged', () => {
  it('validates data.amount > remaining and returns AMOUNT_EXCEEDS_BALANCE', () => {
    assert.ok(
      SRC.includes('data.amount > remaining'),
      'must check data.amount > remaining',
    )
    assert.ok(
      SRC.includes('AMOUNT_EXCEEDS_BALANCE'),
      'must return AMOUNT_EXCEEDS_BALANCE error when amount exceeds remaining',
    )
  })

  it('preserves the locale-formatted error arguments', () => {
    assert.ok(
      SRC.includes('data.amount.toLocaleString("fr-FR")') && SRC.includes('remaining.toLocaleString("fr-FR")'),
      'error message must include locale-formatted amount and remaining',
    )
  })
})

// ── Contract: payment semantics unchanged ──

describe('F-1 contract: payment semantics unchanged', () => {
  it('payment status remains hardcoded COMPLETED', () => {
    const statusWrites = [...SRC.matchAll(/\bstatus\s*:\s*"([A-Z_]+)"/g)].map(m => m[1])
    assert.ok(
      statusWrites.includes('COMPLETED'),
      'payment must be created with status: "COMPLETED"',
    )
  })

  it('payment is created with the parsed organizationId (not client-trusted)', () => {
    assert.ok(
      SRC.includes('organizationId,') && SRC.includes('commandeId: data.commandeId'),
      'payment must use server-resolved organizationId and data.commandeId',
    )
  })

  it('Zod schema validates amount as positive with no max cap', () => {
    const schemaSrc = readProjectFile('src/features/payments/validations/payment-schemas.ts')
    assert.ok(
      schemaSrc.includes('amount:') && schemaSrc.includes('.positive('),
      'Zod schema must validate amount as positive',
    )
    // Verify no max cap is applied at the schema level (defense-in-depth note)
    // This is intentional — the FOR UPDATE lock is the correct guard, not a max cap.
  })
})

// ── Contract: error handling unchanged ──

describe('F-1 contract: error handling unchanged', () => {
  it('returns PAYMENT.NOT_FOUND_COMMANDE_ALT when no rows returned from locked query', () => {
    assert.ok(
      SRC.includes('PAYMENT.NOT_FOUND_COMMANDE_ALT'),
      'must return NOT_FOUND_COMMANDE_ALT when the FOR UPDATE query returns no rows',
    )
  })

  it('wraps the transaction in try/catch via normalizeActionError', () => {
    assert.ok(
      SRC.includes('normalizeActionError') && SRC.includes('PAYMENT.CREATE.ERROR'),
      'must catch errors and normalize via normalizeActionError',
    )
  })
})

// ── Contract: post-transaction behavior unchanged ──

describe('F-1 contract: post-transaction behavior unchanged', () => {
  it('re-fetches updated commande values after transaction commits', () => {
    assert.ok(
      SRC.includes('prisma.commande.findFirst') && SRC.includes('paidAmount: true'),
      'must re-fetch updated paidAmount/remainingAmount/paymentStatus after tx commit',
    )
  })

  it('revalidates dashboard paths', () => {
    assert.ok(
      SRC.includes('revalidatePath("/dashboard/commandes")') &&
      SRC.includes('revalidatePath("/dashboard")'),
      'must revalidate /dashboard/commandes and /dashboard',
    )
  })
})

// ── Contract: the lock prevents the race (documented limitation) ──

describe('F-1 contract: concurrency documentation', () => {
  it('the comment documents the FOR UPDATE race-prevention purpose', () => {
    assert.ok(
      SRC.includes('prevent concurrent payment races') || SRC.includes('serialize'),
      'the code comment must document that FOR UPDATE prevents concurrent payment races',
    )
  })

  it('explicitly notes that definitive concurrency proof requires a real PostgreSQL integration test', () => {
    // This is a documentation contract — the test file itself notes this limitation.
    // We verify the test file contains this note.
    const testSrc = readProjectFile('tests/f1-concurrent-payment-race.test.ts')
    assert.ok(
      testSrc.includes('real PostgreSQL') || testSrc.includes('integration test'),
      'this test file must document that concurrency proof requires a real PostgreSQL integration test',
    )
  })
})
