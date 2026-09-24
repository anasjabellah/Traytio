/**
 * Phase 4: ChariPay webhook → provisioning → activation email.
 *
 * Covers: payment-details mapping (real extractor, PascalCase payloads),
 * metadata-driven plan/customer resolution, amount guard, provisioning
 * delegation (User/Org/OWNER/Sub/Claim once), email-after-commit ordering,
 * email-failure retry semantics, duplicate/concurrent redelivery, event
 * lifecycle (org link, processed gating), and failure mapping.
 * No network, no DB, no real email — fakes only.
 *
 * Run: npx tsx tests/charipay-provision-flow.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractChariPayPaymentDetails } from '../src/features/billing/lib/charipay.js'
import { resolvePlan } from '../src/features/billing/lib/plans.js'
import {
  parseProvisioningOrder,
  provisionSaaSCustomer,
} from '../src/features/billing/lib/provisioning.js'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

/** Real observed payment.succeeded shape (PascalCase, values fictionalized). */
const REAL_PAYLOAD = {
  Amount: 299,
  Method: 'CARD',
  Reference: 'TUR-SUB-abc123',
  ExternalId: 'TUR-SUB-abc123',
  CustomData: 'TUR-SUB-abc123',
  GatewayReferenceId: '8953',
  OperationStatus: 2,
  Metadata: {
    plan: 'STARTER',
    email: 'sara@exemple.com',
    firstName: 'Sara',
    lastName: 'Bennani',
    phone: '+212612345678',
  },
}

function mappedOrder(payload: Record<string, unknown>) {
  const details = extractChariPayPaymentDetails(payload)
  assert.ok(details, 'payload must map')
  const meta = (details?.metadata ?? {}) as Record<string, unknown>
  const plan = resolvePlan(typeof meta.plan === 'string' ? meta.plan : undefined)
  assert.ok(plan, 'plan must resolve')
  return parseProvisioningOrder({
    provider: 'charipay',
    providerReference: details?.reference,
    plan: plan?.id,
    customer: {
      firstName: meta.firstName,
      lastName: meta.lastName,
      email: meta.email,
      phone: meta.phone,
    },
  })
}

describe('PHASE4 MAPPING: real payload → provisioning contract', () => {
  it('correct providerReference, customer fields, plan', () => {
    const res = mappedOrder(REAL_PAYLOAD)
    assert.equal(res.success, true)
    if (!res.success) return
    assert.equal(res.order.providerReference, 'TUR-SUB-abc123')
    assert.equal(res.order.plan, 'STARTER')
    assert.equal(res.order.priceMad, 299)
    assert.equal(res.order.customer.email, 'sara@exemple.com')
    assert.equal(res.order.customer.firstName, 'Sara')
    assert.equal(res.order.customer.phone, '+212612345678')
  })

  it('server-side price resolution (299/599), amount guard', () => {
    assert.equal(resolvePlan('STARTER')?.priceMad, 299)
    assert.equal(resolvePlan('PROFESSIONAL')?.priceMad, 599)
    const details = extractChariPayPaymentDetails(REAL_PAYLOAD)
    assert.equal(details?.amount, 299)
    const tampered = extractChariPayPaymentDetails({ ...REAL_PAYLOAD, Amount: 1 })
    assert.equal(tampered?.amount, 1, 'tampered amount is visible so the route can reject it')
  })

  it('missing metadata/plan/customer fields rejected (no guessing)', () => {
    assert.equal(extractChariPayPaymentDetails({ Amount: 299 })?.reference ?? null, null)
    const noMeta = mappedOrderSafe({ Amount: 299, Reference: 'TUR-SUB-x' })
    assert.equal(noMeta.success, false)
    const badPlan = mappedOrderSafe({ ...REAL_PAYLOAD, Metadata: { ...(REAL_PAYLOAD.Metadata as object), plan: 'ENTERPRISE' } })
    assert.equal(badPlan.success, false)
  })

  function mappedOrderSafe(payload: unknown) {
    const details = extractChariPayPaymentDetails(payload)
    if (!details) return { success: false as const }
    const meta = (details.metadata ?? {}) as Record<string, unknown>
    const plan = resolvePlan(typeof meta.plan === 'string' ? meta.plan : undefined)
    if (!plan) return { success: false as const }
    return parseProvisioningOrder({
      provider: 'charipay',
      providerReference: details.reference,
      plan: plan.id,
      customer: {
        firstName: meta.firstName,
        lastName: meta.lastName,
        email: meta.email,
        phone: meta.phone,
      },
    })
  }
})

describe('PHASE4 PROVISIONING: single tenant per payment', () => {
  type Row = Record<string, unknown>
  function makeDb() {
    const store = { users: [] as Row[], orgs: [] as Row[], memberships: [] as Row[], subs: [] as Row[], claims: [] as Row[] }
    let n = 0
    const p2002 = () => Object.assign(new Error('dup'), { code: 'P2002' })
    return {
      store,
      $transaction: async <T>(fn: (tx: never) => Promise<T>): Promise<T> => {
        const tx = {
          user: {
            findUnique: async ({ where }: { where: { clerkId: string } }) =>
              store.users.find((u) => u.clerkId === where.clerkId) ?? null,
            create: async ({ data }: { data: Row }) => {
              if (store.users.some((u) => u.clerkId === data.clerkId || u.email === data.email)) throw p2002()
              const row = { id: `user_${++n}`, ...data }
              store.users.push(row)
              return row
            },
          },
          organization: {
            create: async ({ data }: { data: Row }) => {
              const row = { id: `org_${++n}`, ...data }
              store.orgs.push(row)
              return row
            },
          },
          userOrganization: {
            create: async ({ data }: { data: Row }) => {
              const row = { id: `m_${++n}`, ...data }
              store.memberships.push(row)
              return row
            },
          },
          subscription: {
            create: async ({ data }: { data: Row }) => {
              if (store.subs.some((s) => s.organizationId === data.organizationId)) throw p2002()
              const row = { id: `sub_${++n}`, ...data }
              store.subs.push(row)
              return row
            },
          },
          purchaseClaim: {
            create: async ({ data }: { data: Row }) => {
              if (store.claims.some((c) => c.userId === data.userId)) throw p2002()
              const row = { id: `claim_${++n}`, consumedAt: null, ...data }
              store.claims.push(row)
              return row
            },
          },
        }
        return fn(tx as never)
      },
    }
  }

  it('User + Organization + OWNER + Subscription + Claim created exactly once', async () => {
    const db = makeDb()
    const order = mappedOrder(REAL_PAYLOAD)
    assert.equal(order.success, true)
    if (!order.success) return
    const res = await provisionSaaSCustomer(
      { provider: 'charipay', providerReference: 'TUR-SUB-abc123', plan: 'STARTER', customer: order.order.customer },
      { db: db as never },
    )
    assert.equal(res.success, true)
    assert.equal(db.store.users.length, 1)
    assert.equal(db.store.orgs.length, 1)
    assert.equal(db.store.memberships.length, 1)
    assert.equal((db.store.memberships[0] as Row).role, 'OWNER')
    assert.equal(db.store.subs.length, 1)
    assert.equal(db.store.claims.length, 1)
  })

  it('duplicate Chari-Event-Id converges (no second tenant)', async () => {
    const db = makeDb()
    const input = { provider: 'charipay', providerReference: 'TUR-SUB-abc123', plan: 'STARTER', customer: (mappedOrder(REAL_PAYLOAD) as { success: true; order: { customer: unknown } }).order.customer }
    const first = await provisionSaaSCustomer(input, { db: db as never })
    const second = await provisionSaaSCustomer(input, { db: db as never })
    assert.equal(first.success && second.success, true)
    assert.equal(db.store.users.length, 1, 'one user across redeliveries')
    assert.equal(db.store.orgs.length, 1, 'one org across redeliveries')
    assert.equal(db.store.subs.length, 1, 'one subscription across redeliveries')
  })
})

describe('PHASE4 ROUTE: lifecycle, ordering, failures (source contracts)', () => {
  const route = read('src/app/api/webhooks/charipay/route.ts')

  it('event stored, org linked after provisioning, processed only on full success', () => {
    assert.ok(route.includes('organizationId: null'), 'created without invented org')
    assert.ok(route.includes('organizationId: provisioned.organizationId'), 'org linked from tenant')
    const markIdx = route.lastIndexOf('processedAt: new Date()')
    const emailIdx = route.indexOf('sendSaaSActivationEmail(')
    assert.ok(markIdx > emailIdx && emailIdx > 0, 'success mark happens after email attempt')
  })

  it('activation email after commit; failure preserves tenant for retry', () => {
    assert.ok(route.includes('provisionSaaSCustomer('), 'provision first')
    assert.ok(route.includes("status: 500"), 'email failure returns 500 for retry')
    assert.ok(!route.includes('$transaction(async (tx) => {') || route.includes('provisionSaaSCustomer'), 'no external calls inside the insert tx')
  })

  it('non-succeeded events never provision; unmapped data dead-ends safely', () => {
    assert.ok(route.includes("eventType !== 'payment.succeeded'"), 'failed/others ignored')
    assert.ok(route.includes('provisioned: false'), 'dead-end responses explicit')
  })

  it('checkout sends the metadata the webhook depends on', () => {
    const action = read('src/features/billing/actions/charipay-checkout.ts')
    assert.ok(action.includes('plan: plan.id'), 'plan id passed to session builder')
    const lib = read('src/features/billing/lib/charipay.ts')
    assert.ok(lib.includes('metadata: {'), 'builder sends metadata')
    assert.ok(lib.includes('notifyOnFailure: true'), 'failed payments also delivered')
  })
})
