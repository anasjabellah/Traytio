/**
 * SaaS provisioning Phase 2 — database provisioning tests.
 *
 * Uses a faithful in-memory Prisma-like store: unique constraints
 * (user.clerkId, user.email, organization.slug, subscription.organizationId),
 * P2002-shaped violations, and snapshot/rollback transactions. No real DB.
 *
 * Run: npx tsx tests/provisioning-phase2.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  provisionSaaSCustomer,
  pendingClerkId,
  PENDING_CLERK_ID_PREFIX,
  type ProvisioningDb,
} from '../src/features/billing/lib/provisioning.js'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

const CUSTOMER = { firstName: 'Sara', lastName: 'Bennani', email: 'sara@exemple.com', phone: '+212612345678' }
const order = (overrides: Record<string, unknown> = {}) => ({
  provider: 'charipay',
  providerReference: 'evt_test_123',
  plan: 'STARTER',
  customer: { ...CUSTOMER },
  ...overrides,
})

type Row = Record<string, unknown>

function p2002(): Error & { code: string } {
  return Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
}

/** Minimal Prisma-shaped fake with unique constraints + tx rollback. */
function makeDb(opts: { failOn?: string } = {}): ProvisioningDb & {
  users: Row[]
  orgs: Row[]
  memberships: Row[]
  subs: Row[]
  claims: Row[]
} {
  const seq = { n: 0 }
  const id = (p: string) => `${p}_${++seq.n}`
  const store = {
    users: [] as Row[],
    orgs: [] as Row[],
    memberships: [] as Row[],
    subs: [] as Row[],
    claims: [] as Row[],
  }
  const api = {
    ...store,
    $transaction: async <T>(fn: (tx: never) => Promise<T>): Promise<T> => {
      const snap = {
        users: [...store.users],
        orgs: [...store.orgs],
        memberships: [...store.memberships],
        subs: [...store.subs],
        claims: [...store.claims],
      }
      const tx = {
        user: {
          findUnique: async ({ where }: { where: { clerkId: string } }) =>
            store.users.find((u) => u.clerkId === where.clerkId) ?? null,
          create: async ({ data }: { data: Row }) => {
            if (opts.failOn === 'user') throw new Error('boom-user')
            if (store.users.some((u) => u.clerkId === data.clerkId)) throw p2002()
            if (store.users.some((u) => u.email === data.email)) throw p2002()
            const row = { id: id('user'), ...data }
            store.users.push(row)
            return row
          },
        },
        organization: {
          create: async ({ data }: { data: Row }) => {
            if (opts.failOn === 'org') throw new Error('boom-org')
            if (store.orgs.some((o) => o.slug === data.slug)) throw p2002()
            const row = { id: id('org'), ...data }
            store.orgs.push(row)
            return row
          },
        },
        userOrganization: {
          create: async ({ data }: { data: Row }) => {
            if (opts.failOn === 'membership') throw new Error('boom-membership')
            const row = { id: id('m'), ...data }
            store.memberships.push(row)
            return row
          },
        },
        subscription: {
          create: async ({ data }: { data: Row }) => {
            if (opts.failOn === 'subscription') throw new Error('boom-sub')
            if (store.subs.some((s) => s.organizationId === data.organizationId)) throw p2002()
            const row = { id: id('sub'), ...data }
            store.subs.push(row)
            return row
          },
        },
        purchaseClaim: {
          create: async ({ data }: { data: Row }) => {
            if (opts.failOn === 'claim') throw new Error('boom-claim')
            if (store.claims.some((c) => c.token === data.token)) throw p2002()
            if (store.claims.some((c) => c.userId === data.userId)) throw p2002()
            const row = { id: id('claim'), consumedAt: null, ...data }
            store.claims.push(row)
            return row
          },
        },
      }
      try {
        return await fn(tx as never)
      } catch (err) {
        // In-place restore: external references (db.users, …) stay valid.
        const restore = (arr: Row[], saved: Row[]) => {
          arr.length = 0
          arr.push(...saved)
        }
        restore(store.users, snap.users)
        restore(store.orgs, snap.orgs)
        restore(store.memberships, snap.memberships)
        restore(store.subs, snap.subs)
        restore(store.claims, snap.claims)
        throw err
      }
    },
  }
  return api
}

describe('PROVISIONING P2: happy paths', () => {
  it('STARTER provisions User + Org + OWNER + Subscription', async () => {
    const db = makeDb()
    const res = await provisionSaaSCustomer(order(), { db })
    assert.equal(res.success, true)
    if (!res.success) return
    assert.equal(res.created, true)
    assert.equal(res.plan, 'STARTER')
    assert.equal(res.priceMad, 299)
    assert.equal(db.users.length, 1)
    assert.equal(db.orgs.length, 1)
    assert.equal(db.memberships.length, 1)
    assert.equal(db.subs.length, 1)
  })

  it('PROFESSIONAL resolves 599 MAD', async () => {
    const db = makeDb()
    const res = await provisionSaaSCustomer(order({ plan: 'PROFESSIONAL', providerReference: 'evt_pro_1' }), { db })
    assert.equal(res.success, true)
    if (!res.success) return
    assert.equal(res.plan, 'PROFESSIONAL')
    assert.equal(res.priceMad, 599)
  })

  it('User created correctly (placeholder identity, names, email)', async () => {
    const db = makeDb()
    await provisionSaaSCustomer(order(), { db })
    const user = db.users[0] as Record<string, unknown>
    assert.ok(String(user.clerkId).startsWith(PENDING_CLERK_ID_PREFIX), 'namespaced pending clerkId')
    assert.equal(user.email, 'sara@exemple.com')
    assert.equal(user.firstName, 'Sara')
    assert.equal(user.lastName, 'Bennani')
  })

  it('Organization created correctly (name, email, phone persisted)', async () => {
    const db = makeDb()
    await provisionSaaSCustomer(order(), { db })
    const org = db.orgs[0] as Record<string, unknown>
    assert.ok(String(org.name).includes('Sara'), 'org named after customer')
    assert.ok(typeof org.slug === 'string' && String(org.slug).length > 0, 'unique slug generated')
    assert.equal(org.email, 'sara@exemple.com')
    assert.equal(org.phone, '+212612345678', 'phone persisted on Organization.phone')
  })

  it('OWNER membership links the new User to the new Org', async () => {
    const db = makeDb()
    const res = await provisionSaaSCustomer(order(), { db })
    assert.equal(res.success, true)
    if (!res.success) return
    const m = db.memberships[0] as Record<string, unknown>
    assert.equal(m.userId, res.userId)
    assert.equal(m.organizationId, res.organizationId)
    assert.equal(m.role, 'OWNER')
  })

  it('Subscription linked correctly (charipay, INCOMPLETE, null provider IDs)', async () => {
    const db = makeDb()
    const res = await provisionSaaSCustomer(order(), { db })
    assert.equal(res.success, true)
    if (!res.success) return
    const sub = db.subs[0] as Record<string, unknown>
    assert.equal(sub.organizationId, res.organizationId)
    assert.equal(sub.provider, 'charipay')
    assert.equal(sub.plan, 'STARTER')
    assert.equal(sub.status, 'INCOMPLETE', 'one-time payment confirmed, no recurring sub yet')
    assert.equal(sub.providerCustomerId, null)
    assert.equal(sub.providerSubscriptionId, null)
  })
})

describe('PROVISIONING P2: validation', () => {
  it('invalid plan rejected with zero writes', async () => {
    const db = makeDb()
    const res = await provisionSaaSCustomer(order({ plan: 'ENTERPRISE' }), { db })
    assert.equal(res.success, false)
    assert.equal(db.users.length + db.orgs.length + db.subs.length, 0)
  })

  it('invalid customer rejected with zero writes', async () => {
    const db = makeDb()
    const res = await provisionSaaSCustomer(order({ customer: { ...CUSTOMER, email: 'bad' } }), { db })
    assert.equal(res.success, false)
    assert.equal(db.users.length + db.orgs.length + db.subs.length, 0)
  })
})

describe('PROVISIONING P2: idempotency', () => {
  it('duplicate provider reference does not create a duplicate tenant', async () => {
    const db = makeDb()
    const first = await provisionSaaSCustomer(order(), { db })
    assert.equal(first.success, true)
    const second = await provisionSaaSCustomer(order(), { db })
    assert.equal(second.success, true)
    if (!second.success) return
    assert.equal(second.created, false, 'replay converges')
    assert.equal(db.users.length, 1)
    assert.equal(db.orgs.length, 1)
    assert.equal(db.memberships.length, 1)
    assert.equal(db.subs.length, 1)
  })

  it('placeholder clerkId is deterministic per order', async () => {
    const db = makeDb()
    await provisionSaaSCustomer(order(), { db })
    const user = db.users[0] as Record<string, unknown>
    assert.equal(user.clerkId, pendingClerkId((await import('../src/features/billing/lib/provisioning.js')).deriveProvisioningKey('charipay', 'evt_test_123')))
  })

  it('same email with a different reference is a conflict, not a takeover', async () => {
    const db = makeDb()
    await provisionSaaSCustomer(order(), { db })
    const res = await provisionSaaSCustomer(order({ providerReference: 'evt_other_9' }), { db })
    assert.equal(res.success, false, 'email collision must not hijack')
    assert.equal(db.users.length, 1, 'no second user')
    assert.equal(db.orgs.length, 1, 'no second org')
  })
})

describe('PROVISIONING P2: transaction rollback', () => {
  for (const stage of ['user', 'org', 'membership', 'subscription', 'claim'] as const) {
    it(`failure at ${stage} leaves zero partial rows`, async () => {
      const db = makeDb({ failOn: stage })
      let threw = false
      try {
        await provisionSaaSCustomer(order({ providerReference: `evt_rb_${stage}` }), { db })
      } catch {
        threw = true
      }
      assert.equal(threw, true, `mid-transaction ${stage} failure must propagate`)
      assert.equal(db.users.length, 0, `no partial users on ${stage} failure`)
      assert.equal(db.orgs.length, 0, `no partial orgs on ${stage} failure`)
      assert.equal(db.memberships.length, 0, `no partial memberships on ${stage} failure`)
      assert.equal(db.subs.length, 0, `no partial subscriptions on ${stage} failure`)
      assert.equal(db.claims.length, 0, `no partial claims on ${stage} failure`)
    })
  }

  it('provisioning issues exactly one purchase claim bound to the tenant', async () => {
    const db = makeDb()
    const res = await provisionSaaSCustomer(order(), { db })
    assert.equal(res.success, true)
    if (!res.success) return
    assert.equal(db.claims.length, 1)
    const claim = db.claims[0] as Record<string, unknown>
    assert.equal(claim.userId, res.userId)
    assert.equal(claim.organizationId, res.organizationId)
    assert.ok(typeof claim.token === 'string' && String(claim.token).length > 0, 'random token issued')
    assert.ok((claim.expiresAt as Date) instanceof Date, 'expiry set')
    assert.equal(claim.consumedAt, null, 'unconsumed at issuance')
  })
})

describe('PROVISIONING P2: scope control', () => {
  it('uses only existing models, no schema widening', () => {
    const src = read('src/features/billing/lib/provisioning.ts')
    assert.ok(!src.includes('BillingWebhookEvent') || src.includes('@@unique'), 'no webhook writes in Phase 2')
    assert.ok(!src.includes('clerkClient') && !src.includes('createInvitation'), 'no Clerk API calls')
    assert.ok(!src.includes('sendEmail') && !src.includes('resend'), 'no emails')
    assert.ok(src.includes("status: 'INCOMPLETE'"), 'honest status documented')
    assert.ok(src.includes('pending:'), 'placeholder identity namespaced')
  })
})
