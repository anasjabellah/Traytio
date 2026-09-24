/**
 * SaaS provisioning Phase 3A — paid-customer Clerk claim tests.
 *
 * Covers: valid/expired/invalid/consumed purchase tokens, successful Clerk
 * claim (placeholder → real ID), org/membership/subscription preservation,
 * no duplicate User/Org, email mismatch, existing real account safety,
 * team-invitation flow intact, normal user.created intact.
 * No DB, no Clerk API, no emails.
 *
 * Run: npx tsx tests/provisioning-claim.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  getPurchaseClaimByToken,
  linkPendingClaimToClerkUser,
  PENDING_CLERK_ID_PREFIX,
  PURCHASE_TOKEN_TTL_MS,
} from '../src/features/billing/lib/provisioning.js'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

const NOW = Date.now()
const future = new Date(NOW + 24 * 60 * 60 * 1000)
const past = new Date(NOW - 1000)

type ClaimRow = {
  id: string
  token: string
  email: string
  userId: string
  organizationId: string
  idempotencyKey: string
  expiresAt: Date
  consumedAt: Date | null
}

function claimRow(overrides: Partial<ClaimRow> = {}): ClaimRow {
  return {
    id: 'claim_1',
    token: 'tok_valid_1',
    email: 'sara@exemple.com',
    userId: 'user_pending_1',
    organizationId: 'org_1',
    idempotencyKey: 'key_1',
    expiresAt: future,
    consumedAt: null,
    ...overrides,
  }
}

function readerDb(rows: ClaimRow[], sub: { plan: string } | null = { plan: 'STARTER' }) {
  return {
    purchaseClaim: {
      findUnique: async ({ where }: { where: { token: string } }) =>
        rows.find((r) => r.token === where.token) ?? null,
    },
    subscription: {
      findUnique: async () => sub,
    },
  }
}

function claimDb(opts: {
  users: Array<{ id: string; clerkId: string; email: string }>;
  claims: ClaimRow[];
}) {
  const state = {
    users: opts.users.map((u) => ({ ...u })),
    claims: opts.claims.map((c) => ({ ...c })),
    userUpdates: [] as Array<{ id: string; clerkId: string }>,
    claimUpdates: [] as string[],
  }
  const db = {
    state,
    user: {
      findUnique: async ({ where }: { where: { email: string } }) =>
        state.users.find((u) => u.email === where.email) ?? null,
    },
    purchaseClaim: {
      findFirst: async ({ where }: { where: { userId: string; consumedAt: null } }) =>
        state.claims.find((c) => c.userId === where.userId && c.consumedAt === null) ?? null,
    },
    $transaction: async <T>(fn: (tx: never) => Promise<T>): Promise<T> => {
      const tx = {
        user: {
          update: async ({ where, data }: { where: { id: string }; data: { clerkId: string } }) => {
            const u = state.users.find((x) => x.id === where.id)
            if (!u) throw new Error('user not found')
            u.clerkId = data.clerkId
            state.userUpdates.push({ id: where.id, clerkId: data.clerkId })
            return u
          },
        },
        purchaseClaim: {
          update: async ({ where, data }: { where: { id: string }; data: { consumedAt: Date } }) => {
            const c = state.claims.find((x) => x.id === where.id)
            if (!c) throw new Error('claim not found')
            if (c.consumedAt) throw Object.assign(new Error('already consumed'), { code: 'P2002' })
            c.consumedAt = data.consumedAt
            state.claimUpdates.push(where.id)
            return c
          },
        },
      }
      return fn(tx as never)
    },
  }
  return db
}

const pendingUser = (email = 'sara@exemple.com') => ({
  id: 'user_pending_1',
  clerkId: `${PENDING_CLERK_ID_PREFIX}key_1`,
  email,
})

describe('CLAIM 3A: purchase token validation', () => {
  it('valid purchase token resolves with tenant context', async () => {
    const res = await getPurchaseClaimByToken('tok_valid_1', { db: readerDb([claimRow()]) as never })
    assert.equal(res.valid, true)
    if (!res.valid) return
    assert.equal(res.claim.email, 'sara@exemple.com')
    assert.equal(res.claim.organizationId, 'org_1')
    assert.equal(res.claim.plan, 'STARTER')
  })

  it('expired token rejected', async () => {
    const res = await getPurchaseClaimByToken('tok_old', {
      db: readerDb([claimRow({ token: 'tok_old', expiresAt: past })]) as never,
    })
    assert.deepEqual(res, { valid: false, reason: 'expired' })
  })

  it('invalid token rejected', async () => {
    const res = await getPurchaseClaimByToken('tok_nope', { db: readerDb([]) as never })
    assert.deepEqual(res, { valid: false, reason: 'invalid' })
    const empty = await getPurchaseClaimByToken('', { db: readerDb([]) as never })
    assert.deepEqual(empty, { valid: false, reason: 'invalid' })
  })

  it('consumed token rejected (no reuse)', async () => {
    const res = await getPurchaseClaimByToken('tok_used', {
      db: readerDb([claimRow({ token: 'tok_used', consumedAt: new Date() })]) as never,
    })
    assert.deepEqual(res, { valid: false, reason: 'consumed' })
  })

  it('token lifetime is 7 days like team invitations', () => {
    assert.equal(PURCHASE_TOKEN_TTL_MS, 7 * 24 * 60 * 60 * 1000)
  })
})

describe('CLAIM 3A: Clerk claim execution', () => {
  it('successful claim swaps placeholder for the real Clerk ID', async () => {
    const db = claimDb({ users: [{ ...pendingUser(), email: 'sara@exemple.com' }], claims: [claimRow()] })
    const out = await linkPendingClaimToClerkUser(
      { clerkId: 'user_2AbC123', email: 'sara@exemple.com' },
      { db: db as never },
    )
    assert.equal(out, 'claimed')
    assert.equal(db.state.users[0].clerkId, 'user_2AbC123', 'pending clerkId replaced')
    assert.deepEqual(db.state.userUpdates, [{ id: 'user_pending_1', clerkId: 'user_2AbC123' }])
    assert.deepEqual(db.state.claimUpdates, ['claim_1'], 'token consumed atomically in the same tx')
  })

  it('existing Organization / OWNER membership / Subscription untouched', async () => {
    // The claim tx issues exactly one user.update + one purchaseClaim.update.
    const db = claimDb({ users: [{ ...pendingUser(), email: 'sara@exemple.com' }], claims: [claimRow()] })
    await linkPendingClaimToClerkUser({ clerkId: 'user_9', email: 'sara@exemple.com' }, { db: db as never })
    assert.equal(db.state.userUpdates.length, 1, 'single user write')
    assert.equal(db.state.claimUpdates.length, 1, 'single claim write')
  })

  it('no duplicate User or Organization is created', async () => {
    const db = claimDb({ users: [{ ...pendingUser(), email: 'sara@exemple.com' }], claims: [claimRow()] })
    await linkPendingClaimToClerkUser({ clerkId: 'user_9', email: 'sara@exemple.com' }, { db: db as never })
    assert.equal(db.state.users.length, 1, 'zero new users')
  })

  it('email mismatch rejected (claim left intact)', async () => {
    const db = claimDb({ users: [{ ...pendingUser(), email: 'sara@exemple.com' }], claims: [claimRow()] })
    const out = await linkPendingClaimToClerkUser({ clerkId: 'user_9', email: 'intruder@exemple.com' }, { db: db as never })
    assert.equal(out, 'none')
    assert.equal(db.state.userUpdates.length, 0)
    assert.equal(db.state.claimUpdates.length, 0)
  })

  it('email case variation still links (stored copy is normalized)', async () => {
    const db = claimDb({ users: [{ ...pendingUser(), email: 'sara@exemple.com' }], claims: [claimRow()] })
    const out = await linkPendingClaimToClerkUser({ clerkId: 'user_9', email: 'Sara@Exemple.com' }, { db: db as never })
    assert.equal(out, 'claimed')
  })

  it('existing real Clerk account handled safely (no takeover)', async () => {
    const db = claimDb({
      users: [{ id: 'user_real_1', clerkId: 'user_realClerk', email: 'owner@exemple.com' }],
      claims: [],
    })
    const out = await linkPendingClaimToClerkUser({ clerkId: 'user_newClerk', email: 'owner@exemple.com' }, { db: db as never })
    assert.equal(out, 'email-taken')
    assert.equal(db.state.userUpdates.length, 0, 'real account untouched')
    assert.equal(db.state.users.length, 1, 'no duplicate user')
  })

  it('unknown email proceeds to normal flow', async () => {
    const db = claimDb({ users: [], claims: [] })
    const out = await linkPendingClaimToClerkUser({ clerkId: 'user_new', email: 'fresh@exemple.com' }, { db: db as never })
    assert.equal(out, 'none')
  })

  it('expired claim is not linked', async () => {
    const db = claimDb({
      users: [{ ...pendingUser(), email: 'sara@exemple.com' }],
      claims: [claimRow({ expiresAt: past })],
    })
    const out = await linkPendingClaimToClerkUser({ clerkId: 'user_9', email: 'sara@exemple.com' }, { db: db as never })
    assert.equal(out, 'none')
    assert.equal(db.state.userUpdates.length, 0)
  })
})

describe('CLAIM 3A: integration contracts (source)', () => {
  it('user.created performs claim before default provisioning', () => {
    const src = read('src/app/api/webhooks/clerk/route.ts')
    const linkIdx = src.indexOf('linkPendingClaimToClerkUser')
    const createIdx = src.indexOf('tx.user.create')
    assert.ok(linkIdx > 0 && createIdx > linkIdx, 'claim branch precedes default user creation')
    assert.ok(src.includes("if (linked === 'claimed')"), 'claimed short-circuits provisioning')
    assert.ok(src.includes("linked === 'email-taken'"), 'real-account collision handled safely')
  })

  it('team invitation flow unchanged', () => {
    const invite = read('src/features/team/actions/invite-member.ts')
    assert.ok(!invite.includes('PurchaseClaim') && !invite.includes('purchase'), 'invite-member untouched by claims')
    const accept = read('src/features/team/actions/accept-invite.ts')
    assert.ok(!accept.includes('PurchaseClaim') && !accept.includes('pending:'), 'accept-invite untouched by claims')
    const signup = read('src/app/sign-up/[[...sign-up]]/page.tsx')
    assert.ok(signup.includes('/accept-invite?token='), 'team fallback preserved')
  })

  it('sign-up branches to activation only for live purchase claims', () => {
    const signup = read('src/app/sign-up/[[...sign-up]]/page.tsx')
    assert.ok(signup.includes('getPurchaseClaimByToken'), 'token kind resolved server-side')
    assert.ok(signup.includes('/activate?token='), 'purchase fallback targets activation')
    assert.ok(signup.includes('redirect("/sign-in")'), 'bare visits still gated')
  })

  it('purchase token design: random, single-use, expiring, ID-free URLs', () => {
    const src = read('src/features/billing/lib/provisioning.ts')
    assert.ok(src.includes('crypto.randomUUID()'), 'cryptographically random token')
    assert.ok(src.includes('consumedAt'), 'single-use enforced')
    assert.ok(src.includes('PURCHASE_TOKEN_TTL_MS'), 'expiry enforced')
    const activate = read('src/app/activate/page.tsx')
    assert.ok(!activate.includes('organizationId=') && !activate.includes('userId='), 'no raw IDs in activation URLs')
  })

  it('schema change is minimal (one table, no existing tables altered)', () => {
    const sql = read('src/prisma/migrations/20260924000000_add_purchase_claim/migration.sql')
    assert.ok(sql.includes('CREATE TABLE "purchase_claims"'), 'only creates purchase_claims')
    assert.ok(!sql.includes('ALTER TABLE "users"'), 'users untouched')
    assert.ok(!sql.includes('ALTER TABLE "organizations"'), 'organizations untouched')
    assert.ok(!sql.includes('ALTER TABLE "subscriptions"'), 'subscriptions untouched')
  })
})
