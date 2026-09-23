/**
 * P1 Payment Idempotency — Repair Verification Tests
 *
 * Repairs verified here (src/features/payments/actions/record-payment.ts):
 *   1. `data is not defined` scope bug: validated payload is hoisted above the
 *      try block so the catch-path P2002 recovery can use it. The catch must
 *      not reference an out-of-scope `data?.` and must not use unsafe
 *      `err?.message` on an `unknown` throw.
 *   2. P2002 narrowing: only a unique violation whose meta.target mentions
 *      idempotencyKey resolves to an idempotent replay — never any other error.
 *   3. Exact-payload semantics in BOTH the pre-check and the P2002 recovery
 *      path: same org + same key + identical payload → replay; any material
 *      divergence (commandeId, amount, method, reference, notes, date) →
 *      IDEMPOTENCY_CONFLICT, never a second payment and never a silent replay.
 *   4. DB authority: Payment.idempotencyKey + @@unique([organizationId,
 *      idempotencyKey]) in schema, applied migration, key persisted on create.
 *
 * Convention: fs source contracts (no transitive deps, no real DB) plus pure
 * replicas of the matching/narrowing helpers. Definitive concurrent proof
 * needs a real PostgreSQL integration test with two parallel transactions.
 *
 * Run: npx tsx tests/p1-payment-idempotency.test.ts
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
const SCHEMA = readProjectFile('src/features/payments/validations/payment-schemas.ts')
const PRISMA_SCHEMA = readProjectFile('src/prisma/schema.prisma')
const DIALOG = readProjectFile('src/features/payments/components/add-payment-dialog.tsx')
const MIG_DIR = path.join(ROOT, 'src/prisma/migrations/20260923000000_add_payment_idempotency_key')
const MIG_SQL = readFileSync(path.join(MIG_DIR, 'migration.sql'), 'utf8')

// ── Replicas: faithful to the helpers in record-payment.ts ──

type Row = {
  commandeId: string
  amount: number
  method: string
  reference: string | null
  notes: string | null
  createdAt: Date
}

type Req = {
  commandeId: string
  amount: number
  method: string
  date: string
  reference?: string | null
  notes?: string | null
}

/** Mirrors isSameLogicalPayment. */
function isSameLogicalPayment(existing: Row, data: Req): boolean {
  return (
    existing.commandeId === data.commandeId &&
    Number(existing.amount) === data.amount &&
    existing.method === data.method &&
    (existing.reference ?? null) === (data.reference ?? null) &&
    (existing.notes ?? null) === (data.notes ?? null) &&
    existing.createdAt.toISOString().slice(0, 10) === data.date
  )
}

/** Mirrors isIdempotencyUniqueViolation. */
function isIdempotencyUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const code = (err as { code?: unknown }).code
  if (code !== 'P2002') return false
  const target = (err as { meta?: { target?: unknown } }).meta?.target
  const text = Array.isArray(target) ? target.join(' ') : ''
  return text.includes('idempotencyKey')
}

const BASE_ROW: Row = {
  commandeId: 'cmd-1',
  amount: 5000,
  method: 'TRANSFER',
  reference: 'REF-123',
  notes: null,
  createdAt: new Date('2026-09-23T10:00:00.000Z'),
}

const BASE_REQ: Req = {
  commandeId: 'cmd-1',
  amount: 5000,
  method: 'TRANSFER',
  date: '2026-09-23',
  reference: 'REF-123',
  notes: null,
}

// ── Behavior: exact-payload match ──

describe('P1 idempotency BEHAVIOR: same key + same payload → replay', () => {
  it('identical payloads match', () => {
    assert.equal(isSameLogicalPayment(BASE_ROW, BASE_REQ), true)
  })

  it('null-vs-undefined reference/notes normalize to a match', () => {
    const nullRow: Row = { ...BASE_ROW, reference: null, notes: null }
    assert.equal(isSameLogicalPayment(nullRow, { ...BASE_REQ, reference: undefined, notes: undefined }), true)
  })
})

describe('P1 idempotency BEHAVIOR: same key + divergent payload → conflict', () => {
  it('different amount conflicts', () => {
    assert.equal(isSameLogicalPayment(BASE_ROW, { ...BASE_REQ, amount: 3000 }), false)
  })

  it('different commandeId conflicts', () => {
    assert.equal(isSameLogicalPayment(BASE_ROW, { ...BASE_REQ, commandeId: 'cmd-2' }), false)
  })

  it('different method conflicts', () => {
    assert.equal(isSameLogicalPayment(BASE_ROW, { ...BASE_REQ, method: 'CASH' }), false)
  })

  it('different reference conflicts', () => {
    assert.equal(isSameLogicalPayment(BASE_ROW, { ...BASE_REQ, reference: 'REF-999' }), false)
  })

  it('different notes conflicts', () => {
    assert.equal(isSameLogicalPayment(BASE_ROW, { ...BASE_REQ, notes: 'extra' }), false)
  })

  it('different date conflicts', () => {
    assert.equal(isSameLogicalPayment(BASE_ROW, { ...BASE_REQ, date: '2026-09-24' }), false)
  })
})

describe('P1 idempotency BEHAVIOR: P2002 narrowing', () => {
  it('P2002 on the idempotency target qualifies', () => {
    assert.equal(
      isIdempotencyUniqueViolation({ code: 'P2002', meta: { target: ['organizationId', 'idempotencyKey'] } }),
      true,
    )
  })

  it('P2002 on another constraint does not qualify', () => {
    assert.equal(
      isIdempotencyUniqueViolation({ code: 'P2002', meta: { target: ['organizationId', 'number'] } }),
      false,
    )
  })

  it('non-P2002 errors never qualify', () => {
    assert.equal(isIdempotencyUniqueViolation({ code: 'P2025', meta: { target: ['idempotencyKey'] } }), false)
    assert.equal(isIdempotencyUniqueViolation(new Error('connection reset')), false)
    assert.equal(isIdempotencyUniqueViolation(null), false)
    assert.equal(isIdempotencyUniqueViolation('P2002'), false)
    assert.equal(isIdempotencyUniqueViolation({}), false)
  })
})

describe('P1 idempotency BEHAVIOR: key-space semantics', () => {
  // org-scoped store keyed by organizationId + idempotencyKey — mirrors the
  // DB unique index and the org-scoped where clause.
  function makeStore() {
    const rows = new Map<string, { amount: number }>()
    return {
      size: () => rows.size,
      insert: (org: string, key: string | undefined, amount: number): 'created' | 'duplicate-key' => {
        if (!key) { rows.set(`row-${rows.size}`, { amount }); return 'created' }
        const k = `${org}|${key}`
        if (rows.has(k)) return 'duplicate-key'
        rows.set(k, { amount })
        return 'created'
      },
    }
  }

  it('same key + same payload twice → exactly one row (DB rejects the second)', () => {
    const store = makeStore()
    assert.equal(store.insert('org-a', 'abc123', 5000), 'created')
    assert.equal(store.insert('org-a', 'abc123', 5000), 'duplicate-key')
    assert.equal(store.size(), 1)
  })

  it('different keys + same amount → two legitimate rows', () => {
    const store = makeStore()
    assert.equal(store.insert('org-a', 'key-a', 5000), 'created')
    assert.equal(store.insert('org-a', 'key-b', 5000), 'created')
    assert.equal(store.size(), 2)
  })

  it('same key in different organizations → independent rows', () => {
    const store = makeStore()
    assert.equal(store.insert('org-a', 'abc', 5000), 'created')
    assert.equal(store.insert('org-b', 'abc', 5000), 'created')
    assert.equal(store.size(), 2)
  })

  it('payments without a key never collide', () => {
    const store = makeStore()
    assert.equal(store.insert('org-a', undefined, 5000), 'created')
    assert.equal(store.insert('org-a', undefined, 5000), 'created')
    assert.equal(store.size(), 2)
  })

  it('overpay guard still bounds distinct-key payments (existing concurrency rule)', () => {
    const remaining = 5000
    const allowed = (amount: number) => amount <= remaining
    assert.equal(allowed(5000), true)
    assert.equal(allowed(5001), false)
  })
})

// ── Source contracts: the scope-bug repair ──

describe('P1 idempotency SOURCE CONTRACT: catch-block scope repair', () => {
  it('validated payload is hoisted above the try block', () => {
    const tryIdx = SRC.indexOf('try {')
    const parseIdx = SRC.indexOf('recordPaymentSchema.safeParse(input)')
    assert.ok(parseIdx > 0 && tryIdx > 0 && parseIdx < tryIdx, 'safeParse must run before try so `data` is in scope for catch')
  })

  it('catch block references in-scope `data`, never an undeclared `data?.`', () => {
    const catchIdx = SRC.indexOf('} catch (err: unknown) {')
    assert.ok(catchIdx > 0, 'catch block must exist')
    const catchBody = SRC.slice(catchIdx)
    assert.ok(!catchBody.includes('data?.'), 'must not use optional-chained `data?.` (undeclared in catch scope)')
    assert.ok(catchBody.includes('data.idempotencyKey'), 'catch must read the hoisted `data` directly')
  })

  it('no unsafe property access on the unknown throw', () => {
    const catchBody = SRC.slice(SRC.indexOf('} catch (err: unknown) {'))
    assert.ok(!catchBody.includes('err?.message'), 'must not read `.message` off `unknown` without narrowing')
    assert.ok(!catchBody.includes('err.message'), 'must not read `.message` off `unknown` without narrowing')
  })

  it('P2002 recovery is narrowed to the idempotency target', () => {
    assert.ok(SRC.includes('isIdempotencyUniqueViolation'), 'catch must delegate to the narrowing helper')
    assert.ok(SRC.includes("code !== \"P2002\""), 'helper must require the P2002 code')
    assert.ok(SRC.includes('idempotencyKey'), 'helper must check the violation target mentions idempotencyKey')
  })
})

// ── Source contracts: idempotency semantics ──

describe('P1 idempotency SOURCE CONTRACT: request flow', () => {
  it('the key is persisted on payment creation', () => {
    assert.ok(
      SRC.includes('idempotencyKey: data.idempotencyKey ?? undefined'),
      'tx.payment.create must persist the client-supplied key',
    )
  })

  it('the pre-check lookup is tenant-scoped', () => {
    assert.ok(
      SRC.includes('organizationId,') && SRC.includes('idempotencyKey: data.idempotencyKey'),
      'existing-payment lookup must scope by server-derived organizationId + key',
    )
  })

  it('both replay paths verify the exact payload before reusing', () => {
    const occurrences = SRC.split('isSameLogicalPayment(existing, data)').length - 1
    assert.equal(occurrences, 2, `pre-check and P2002 recovery must both call isSameLogicalPayment (found ${occurrences})`)
  })

  it('both conflict paths return IDEMPOTENCY_CONFLICT', () => {
    const occurrences = SRC.split('PAYMENT.VALIDATION.IDEMPOTENCY_CONFLICT').length - 1
    assert.equal(occurrences, 2, `pre-check and P2002 recovery must both surface IDEMPOTENCY_CONFLICT (found ${occurrences})`)
  })

  it('the matcher covers every material field', () => {
    const helper = SRC.slice(SRC.indexOf('function isSameLogicalPayment'))
    for (const field of ['commandeId', 'existing.amount', 'existing.method', 'existing.reference', 'existing.notes', 'createdAt']) {
      assert.ok(helper.includes(field), `matcher must compare ${field}`)
    }
  })

  it('replays are flagged so the client can suppress duplicate feedback', () => {
    const occurrences = SRC.split('idempotentReplay: true').length - 1
    assert.equal(occurrences, 2, `both replay returns must flag idempotentReplay (found ${occurrences})`)
  })
})

describe('P1 idempotency SOURCE CONTRACT: no duplicate side effects on replay', () => {
  it('replay returns happen before notification fan-out', () => {
    const firstReplay = SRC.indexOf('idempotentReplay: true')
    const notifyIdx = SRC.indexOf('notifyOrganizationMembers(prisma,')
    assert.ok(firstReplay > 0 && notifyIdx > 0 && firstReplay < notifyIdx, 'replays must return before any notification is sent')
  })

  it('replay returns happen before the transaction (no duplicate activity)', () => {
    const firstReplay = SRC.indexOf('idempotentReplay: true')
    const txIdx = SRC.indexOf('prisma.$transaction(async (tx)')
    assert.ok(firstReplay > 0 && txIdx > 0 && firstReplay < txIdx, 'pre-check replay must return before tx.payment.create / activity')
  })

  it('notification still fires exactly once on the fresh-create path', () => {
    const occurrences = SRC.split('notifyOrganizationMembers(prisma,').length - 1
    assert.equal(occurrences, 1, `notification fan-out call must appear exactly once (found ${occurrences})`)
  })

  it('activity is still written exactly once inside the transaction', () => {
    const occurrences = SRC.split('tx.commandeActivity.create(').length - 1
    assert.equal(occurrences, 1, `commandeActivity write must appear exactly once (found ${occurrences})`)
  })
})

// ── Source contracts: existing protections preserved ──

describe('P1 idempotency SOURCE CONTRACT: existing payment protections intact', () => {
  it('FOR UPDATE overpayment protection is preserved', () => {
    assert.ok(SRC.includes('FOR UPDATE'), 'FOR UPDATE lock must remain')
    assert.ok(SRC.includes('data.amount > remaining'), 'overpay guard must remain')
    assert.ok(SRC.includes('AMOUNT_EXCEEDS_BALANCE'), 'overpay error must remain')
  })

  it('RBAC and org scoping are preserved', () => {
    assert.ok(SRC.includes("assertCan('payments', 'create')"), 'payments:create RBAC must remain')
    assert.ok(SRC.includes('prisma.commande.findFirst('), 'pre-tx org-scoped commande check must remain')
  })

  it('payments are still created COMPLETED with balance sync', () => {
    assert.ok(SRC.includes('status: "COMPLETED"'), 'hardcoded COMPLETED must remain')
    assert.ok(SRC.includes('recalculateCommandeBalances(tx,'), 'in-tx balance/invoice sync must remain')
  })

  it('schema keeps the key optional and bounded', () => {
    assert.ok(SCHEMA.includes('idempotencyKey: z.string().min(1).max(128).optional()'), 'key must stay optional, min 1, max 128')
  })
})

// ── Source contracts: Prisma schema + migration + client ──

describe('P1 idempotency SOURCE CONTRACT: schema, migration, database', () => {
  it('Prisma schema declares the nullable key with org-scoped uniqueness', () => {
    assert.ok(PRISMA_SCHEMA.includes('idempotencyKey String?'), 'Payment must declare idempotencyKey String?')
    assert.ok(PRISMA_SCHEMA.includes('@@unique([organizationId, idempotencyKey])'), 'uniqueness must be scoped to organizationId, never global')
  })

  it('migration exists and touches only the payments table', () => {
    assert.ok(MIG_SQL.includes('ALTER TABLE "payments" ADD COLUMN "idempotencyKey"'), 'migration must add the column')
    assert.ok(MIG_SQL.includes('payments_organizationId_idempotencyKey_key'), 'migration must create the org+key uniqueness')
    assert.ok(!/ALTER TABLE "(?!payments")[a-z_]+"/.test(MIG_SQL), 'migration must not alter any other table')
    assert.ok(!MIG_SQL.includes('Decimal'), 'migration must not touch Decimal columns')
  })

  it('generated Prisma client exposes the field (stale-client root cause guard)', () => {
    const clientTypes = readProjectFile('node_modules/.prisma/client/index.d.ts')
    assert.ok(clientTypes.includes('idempotencyKey'), 'regenerated client must expose idempotencyKey — restart the dev server after `prisma generate`')
  })
})

// ── Source contracts: client integration ──

describe('P1 idempotency SOURCE CONTRACT: dialog sends a stable key', () => {
  it('dialog generates the key once per open session and reuses it for retries', () => {
    assert.ok(DIALOG.includes('idempotencyKeyRef'), 'dialog must hold the key in a ref (stable across retries, not per render)')
    assert.ok(DIALOG.includes('idempotencyKey: idempotencyKeyRef.current'), 'dialog must send the key with the request')
  })

  it('a new payment attempt gets a new key', () => {
    const occurrences = DIALOG.split('generateIdempotencyKey()').length - 1
    assert.ok(occurrences >= 2, `key must be regenerated on open and on reset (found ${occurrences})`)
  })

  it('no duplicate success feedback on idempotent replay', () => {
    assert.ok(DIALOG.includes('result.idempotentReplay'), 'dialog must check the replay flag before notifying success')
  })
})
