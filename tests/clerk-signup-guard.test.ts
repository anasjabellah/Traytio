/**
 * PHASE 3 — stray-tenant prevention on PurchaseClaim email mismatch (Gap C).
 *
 * Business rule: a signup carrying purchase evidence (the server-validated
 * token the /sign-up purchase branch passes via Clerk unsafeMetadata) must
 * NEVER fall through to default provisioning when linkPendingClaimToClerkUser
 * did not link the claim (Clerk email ≠ claim email, or the claim lapsed).
 * The mismatch path must: acknowledge 200, write nothing, leave the
 * PurchaseClaim unconsumed/reusable, and create no User/Organization/OWNER.
 * Team-invitation signups carry NO purchase evidence and keep the existing
 * default-provisioning path (they need the local User row for accept-invite).
 *
 * Coverage:
 *   A. claim email matches      → linked/consumed, purchase path intact
 *   B. claim email differs      → unconsumed + default provisioning refused
 *   C. comparison is case-insensitive (same normalization as consumption)
 *   D. no claim + no evidence  → default path intact; Phase 2 route gate
 *                                 remains the blocker for random signups
 *   E. invitation flow untouched (branch untagged → default path preserved)
 *   F. idempotency behavior intact (existing-clerkId + P2002 short-circuits)
 *
 * Conventions: real link/validator execution against fake in-memory dbs +
 * fs source-contract checks + faithful decision replica — no DB, no Clerk,
 * no Svix (same style as tests/provisioning-claim.test.ts, tests/b14-*).
 *
 * Run: npx tsx tests/clerk-signup-guard.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  linkPendingClaimToClerkUser,
  getPurchaseClaimByToken,
  PENDING_CLERK_ID_PREFIX,
} from '../src/features/billing/lib/provisioning.js'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

const NOW = Date.now()
const future = new Date(NOW + 24 * 60 * 60 * 1000)

// ── Fake claim row + dbs (same shapes as tests/provisioning-claim.test.ts) ──

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
  users: Array<{ id: string; clerkId: string; email: string }>
  claims: ClaimRow[]
}) {
  const state = {
    users: opts.users.map((u) => ({ ...u })),
    claims: opts.claims.map((c) => ({ ...c })),
    userUpdates: [] as Array<{ id: string; clerkId: string }>,
    claimUpdates: [] as string[],
    orgCreates: 0,
    membershipCreates: 0,
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
            c.consumedAt = data.consumedAt
            state.claimUpdates.push(where.id)
            return c
          },
        },
        organization: {
          create: async () => {
            state.orgCreates += 1
            return { id: `org_created_${state.orgCreates}` }
          },
        },
        userOrganization: {
          create: async () => {
            state.membershipCreates += 1
            return {}
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

// ── Faithful replicas of the Phase 3 route logic ──

/** Mirrors purchaseTokenEvidence() in src/app/api/webhooks/clerk/route.ts. */
function purchaseTokenEvidence(data: unknown): string | null {
  const meta = (data as { unsafe_metadata?: unknown } | null | undefined)?.unsafe_metadata
  if (typeof meta !== 'object' || meta === null) return null
  const token = (meta as Record<string, unknown>).traytioPurchaseToken
  if (typeof token !== 'string') return null
  const trimmed = token.trim()
  return trimmed.length > 0 && trimmed.length <= 512 ? trimmed : null
}

type LinkOutcome = 'claimed' | 'none' | 'email-taken'

type Decision =
  | 'ack-existing'
  | 'linked-claimed'
  | 'ack-email-taken'
  | 'retry-500'
  | 'refuse-default'
  | 'default-provision'

/**
 * Mirrors the user.created decision order after Svix verification:
 * idempotency → link claim → purchase-evidence guard → default provisioning.
 */
function userCreatedDecision(input: {
  alreadyProvisioned?: boolean
  linkOutcome: LinkOutcome | 'link-error'
  unsafeMetadata: unknown
}): Decision {
  if (input.alreadyProvisioned) return 'ack-existing'
  if (input.linkOutcome === 'claimed') return 'linked-claimed'
  if (input.linkOutcome === 'email-taken') return 'ack-email-taken'
  if (input.linkOutcome === 'link-error') return 'retry-500'
  if (purchaseTokenEvidence({ unsafe_metadata: input.unsafeMetadata })) return 'refuse-default'
  return 'default-provision'
}

const purchaseMeta = (token = 'tok_valid_1') => ({ traytioPurchaseToken: token })

// ── Tests ──

describe('PHASE 3A: matching claim email → linked, purchase path intact', () => {
  it('real link execution consumes the claim and swaps the clerkId', async () => {
    const db = claimDb({ users: [{ ...pendingUser() }], claims: [claimRow()] })
    const out = await linkPendingClaimToClerkUser(
      { clerkId: 'user_2AbC123', email: 'sara@exemple.com' },
      { db: db as never },
    )
    assert.equal(out, 'claimed')
    assert.deepEqual(db.state.claimUpdates, ['claim_1'], 'claim consumed in the link tx')
    assert.equal(db.state.users[0].clerkId, 'user_2AbC123')
    assert.equal(db.state.orgCreates, 0, 'default provisioning never runs on match')
    assert.equal(db.state.membershipCreates, 0)
  })

  it('decision: claimed short-circuits before the evidence guard', () => {
    assert.equal(
      userCreatedDecision({ linkOutcome: 'claimed', unsafeMetadata: purchaseMeta() }),
      'linked-claimed',
    )
  })

  it('source: claimed return precedes the mismatch guard and default tx', () => {
    const src = read('src/app/api/webhooks/clerk/route.ts')
    const linkCall = src.indexOf('const linked = await linkPendingClaimToClerkUser')
    const claimedReturn = src.indexOf("if (linked === 'claimed')")
    const guard = src.indexOf('purchase-claim email mismatch guard')
    const create = src.indexOf('tx.user.create')
    assert.ok(linkCall > 0, 'link call present')
    assert.ok(linkCall < claimedReturn, 'link call before claimed check')
    assert.ok(claimedReturn < guard, 'claimed short-circuit before guard')
    assert.ok(guard < create, 'guard before default user creation')
  })
})

describe('PHASE 3B: mismatched claim email → unconsumed claim, no default tenant', () => {
  it('real link execution returns none and leaves the claim reusable', async () => {
    const db = claimDb({ users: [{ ...pendingUser() }], claims: [claimRow()] })
    const out = await linkPendingClaimToClerkUser(
      { clerkId: 'user_intruder', email: 'intruder@exemple.com' },
      { db: db as never },
    )
    assert.equal(out, 'none')
    assert.equal(db.state.claimUpdates.length, 0, 'claim NOT consumed (requirement: reusable)')
    assert.equal(db.state.claims[0].consumedAt, null, 'claim stays unconsumed')
    assert.equal(db.state.userUpdates.length, 0)
    assert.equal(db.state.orgCreates, 0)
    assert.equal(db.state.membershipCreates, 0)
  })

  it('decision: evidence + unlinked claim → default provisioning refused', () => {
    assert.equal(
      userCreatedDecision({ linkOutcome: 'none', unsafeMetadata: purchaseMeta() }),
      'refuse-default',
    )
    // Even lapsed/unconsumable evidence fails closed.
    assert.equal(
      userCreatedDecision({ linkOutcome: 'none', unsafeMetadata: { traytioPurchaseToken: 'x'.repeat(10) } }),
      'refuse-default',
    )
  })

  it('source: guard returns 200 before the transactional default provisioning', () => {
    const src = read('src/app/api/webhooks/clerk/route.ts')
    const guard = src.indexOf('purchase-claim email mismatch guard')
    const guardReturn = src.indexOf("return new Response('OK', { status: 200 })", guard)
    const create = src.indexOf('tx.user.create')
    assert.ok(guard > 0 && guardReturn > guard, 'guard acknowledges with 200')
    assert.ok(guardReturn < create, 'ack happens before any User/Org/Membership write')
    assert.ok(src.includes('refusing default provisioning'), 'mismatch is logged')
    assert.ok(src.includes('getPurchaseClaimByToken'), 'reuses the existing claim validator')
    assert.ok(src.includes("'email-mismatch'"), 'mismatch classified for ops logs')
  })

  it('source: the guard is read-only — no create/update/delete in its block', () => {
    const src = read('src/app/api/webhooks/clerk/route.ts')
    const start = src.indexOf('purchase-claim email mismatch guard')
    const end = src.indexOf('No purchase evidence')
    assert.ok(start > 0 && end > start, 'guard block located')
    const guardSlice = src.slice(start, end)
    assert.ok(!guardSlice.includes('.create('), 'guard creates nothing')
    assert.ok(!guardSlice.includes('.update('), 'guard updates nothing (claim untouched)')
    assert.ok(!guardSlice.includes('.delete('), 'guard deletes nothing')
  })
})

describe('PHASE 3C: email comparison is case-insensitive (consumption normalization)', () => {
  it('real link: mixed-case claim email still links (trim + lowercase)', async () => {
    const db = claimDb({
      users: [{ ...pendingUser('customer@example.com') }],
      claims: [claimRow({ email: 'Customer@Example.com' })],
    })
    const out = await linkPendingClaimToClerkUser(
      { clerkId: 'user_case', email: 'CUSTOMER@EXAMPLE.COM' },
      { db: db as never },
    )
    assert.equal(out, 'claimed')
    assert.equal(db.state.claimUpdates.length, 1)
  })

  it('validator: valid claim resolves regardless of stored email casing', async () => {
    const res = await getPurchaseClaimByToken('tok_valid_1', {
      db: readerDb([claimRow({ email: 'Customer@Example.com' })]) as never,
    })
    assert.equal(res.valid, true)
    if (!res.valid) return
    assert.equal(res.claim.email, 'Customer@Example.com')
  })

  it('guard replica: match on case variation, mismatch on different address', () => {
    const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()
    assert.ok(same('Customer@Example.com', 'customer@example.com'), 'case variation matches')
    assert.ok(!same('customer@example.com', 'other@example.com'), 'different address refuses')
  })

  it('source: guard comparison normalizes both sides exactly like consumption', () => {
    const src = read('src/app/api/webhooks/clerk/route.ts')
    assert.ok(
      src.includes(
        'claim.claim.email.trim().toLowerCase() === email.trim().toLowerCase()',
      ),
      'guard uses trim+lowercase on both sides',
    )
    const provisioning = read('src/features/billing/lib/provisioning.ts')
    assert.ok(
      provisioning.includes('const email = input.email.trim().toLowerCase()'),
      'consumption normalization unchanged (same rule)',
    )
  })
})

describe('PHASE 3D: no claim + no evidence → default path intact, Phase 2 gate blocks randoms', () => {
  it('decision: untagged signup keeps default provisioning (invitation-compatible)', () => {
    assert.equal(
      userCreatedDecision({ linkOutcome: 'none', unsafeMetadata: null }),
      'default-provision',
    )
    assert.equal(
      userCreatedDecision({ linkOutcome: 'none', unsafeMetadata: undefined }),
      'default-provision',
    )
    assert.equal(
      userCreatedDecision({ linkOutcome: 'none', unsafeMetadata: {} }),
      'default-provision',
    )
    assert.equal(
      userCreatedDecision({ linkOutcome: 'none', unsafeMetadata: { traytioPurchaseToken: 123 } }),
      'default-provision',
      'non-string values are not evidence',
    )
  })

  it('source: transactional default provisioning still exists for untagged signups', () => {
    const src = read('src/app/api/webhooks/clerk/route.ts')
    assert.ok(src.includes('await prisma.$transaction'), 'default provisioning is transactional')
    assert.ok(src.includes('tx.user.create'), 'user creation present')
    assert.ok(src.includes('tx.organization.create'), 'org creation present')
    assert.ok(src.includes('role: OrgRole.OWNER'), 'OWNER membership creation present')
  })

  it('source: Phase 2 route gate still blocks invalid/unreachable signups', () => {
    const signup = read('src/app/sign-up/[[...sign-up]]/page.tsx')
    assert.ok(signup.includes('redirect("/sign-in")'), 'tokenless/invalid tokens redirected')
    assert.ok(signup.includes('getPurchaseClaimByToken'), 'purchase validator still gates')
    assert.ok(signup.includes('getInvitationByToken'), 'invitation validator still gates')
  })
})

describe('PHASE 3E: invitation flow preserved (branch carries no purchase evidence)', () => {
  it('source: traytioPurchaseToken appears exactly once — the purchase branch', () => {
    const signup = read('src/app/sign-up/[[...sign-up]]/page.tsx')
    const occurrences = signup.split('traytioPurchaseToken').length - 1
    assert.equal(occurrences, 1, 'only the purchase branch is tagged')
    assert.ok(signup.includes('/accept-invite?token='), 'invitation fallback untouched')
    assert.ok(signup.includes('unsafeMetadata'), 'evidence channel present on purchase branch')
  })

  it('source: invitation modules carry no purchase evidence / claim coupling', () => {
    for (const file of [
      'src/features/team/actions/invite-member.ts',
      'src/features/team/actions/accept-invite.ts',
      'src/features/team/actions/get-invitation-by-token.ts',
      'src/app/accept-invite/accept-invite-client.tsx',
    ]) {
      const src = read(file)
      assert.ok(!src.includes('traytioPurchaseToken'), `${file}: no purchase evidence`)
      assert.ok(!src.includes('unsafeMetadata'), `${file}: no metadata coupling`)
    }
  })

  it('decision: invite signup (untagged) reaches default provisioning for its User row', () => {
    // accept-invite.ts:41-44 requires a local user row created by user.created.
    assert.equal(
      userCreatedDecision({ linkOutcome: 'none', unsafeMetadata: null }),
      'default-provision',
    )
  })
})

describe('PHASE 3F: idempotency behavior intact', () => {
  it('decision: already-provisioned short-circuits before link/guard', () => {
    assert.equal(
      userCreatedDecision({
        alreadyProvisioned: true,
        linkOutcome: 'none',
        unsafeMetadata: purchaseMeta(),
      }),
      'ack-existing',
    )
  })

  it('decision: link error still surfaces as retryable 500 (no guard swallowing)', () => {
    assert.equal(
      userCreatedDecision({ linkOutcome: 'link-error', unsafeMetadata: purchaseMeta() }),
      'retry-500',
    )
  })

  it('source: existing-clerkId early return and P2002 convergence untouched', () => {
    const src = read('src/app/api/webhooks/clerk/route.ts')
    assert.ok(
      src.includes('const existing = await prisma.user.findUnique({ where: { clerkId: id } })'),
      'idempotency pre-check present',
    )
    assert.ok(src.includes("err.code === 'P2002'"), 'duplicate race converges to 200')
    assert.ok(
      src.includes('Failed to link purchase claim'),
      'link failures still answer 500 for provider retry',
    )
  })

  it('source: no schema, ChariPay, or middleware coupling introduced', () => {
    const src = read('src/app/api/webhooks/clerk/route.ts')
    assert.ok(!src.includes('charipay'), 'clerk webhook does not touch ChariPay')
    assert.ok(!src.includes('subscription.create'), 'guard never creates subscriptions')
    const schema = read('src/prisma/schema.prisma')
    assert.ok(!schema.includes('traytioPurchaseToken'), 'no schema change for evidence channel')
  })
})
