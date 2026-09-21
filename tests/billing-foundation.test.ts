/**
 * SaaS billing foundation — regression tests.
 *
 * Covers: org-scoped subscription reads, null-safe absence, ACTIVE/TRIALING
 * detection, CANCELED exclusion, PAST_DUE strict semantics, plan retrieval,
 * cross-org rejection, webhook-event uniqueness + no-double-insert, and
 * Payment/Invoice models untouched — plus source contracts on the schema,
 * migration, helpers, and permission boundaries.
 *
 * Conventions: dependency-injected replicas + fs source-contract checks —
 * no @clerk/@prisma imports, no DB.
 *
 * Run: npx tsx tests/billing-foundation.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')
const read = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf8')

// ── Replicas (mirror billing.ts semantics) ─────────────────────────

type Status =
  | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
  | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'UNPAID'

type Sub = { organizationId: string; plan: string; status: Status }
type WebhookRow = { provider: string; providerEventId: string }

const ACTIVE_STATUSES: Status[] = ['TRIALING', 'ACTIVE']

function makeStore(subs: Sub[] = [], events: WebhookRow[] = []) {
  return { subs: [...subs], events: [...events] }
}
type Store = ReturnType<typeof makeStore>

function getSubscription(store: Store, organizationId: string): Sub | null {
  return store.subs.find((s) => s.organizationId === organizationId) ?? null
}

function hasActiveSubscription(store: Store, organizationId: string): boolean {
  const s = getSubscription(store, organizationId)
  return s !== null && ACTIVE_STATUSES.includes(s.status)
}

function getCurrentPlan(store: Store, organizationId: string): string | null {
  return getSubscription(store, organizationId)?.plan ?? null
}

function hasPlan(store: Store, organizationId: string, ...plans: string[]): boolean {
  const s = getSubscription(store, organizationId)
  return !!s && plans.includes(s.plan) && ACTIVE_STATUSES.includes(s.status)
}

function insertWebhookEvent(store: Store, row: WebhookRow): boolean {
  const dup = store.events.some(
    (e) => e.provider === row.provider && e.providerEventId === row.providerEventId,
  )
  if (dup) return false
  store.events.push({ ...row })
  return true
}

// ── 1–9: behavior ──────────────────────────────────────────────────

describe('BILLING BEHAVIOR', () => {
  it('1. organization can have a subscription', () => {
    const store = makeStore([{ organizationId: 'org_a', plan: 'PROFESSIONAL', status: 'ACTIVE' }])
    assert.ok(getSubscription(store, 'org_a'))
  })

  it('2. subscription reads are organization-scoped', () => {
    const store = makeStore([
      { organizationId: 'org_a', plan: 'STARTER', status: 'ACTIVE' },
      { organizationId: 'org_b', plan: 'ENTERPRISE', status: 'ACTIVE' },
    ])
    assert.equal(getSubscription(store, 'org_a')?.plan, 'STARTER')
    assert.equal(getSubscription(store, 'org_b')?.plan, 'ENTERPRISE')
  })

  it('3. organization without subscription returns null safely', () => {
    const store = makeStore()
    assert.equal(getSubscription(store, 'org_a'), null)
    assert.equal(hasActiveSubscription(store, 'org_a'), false)
    assert.equal(getCurrentPlan(store, 'org_a'), null)
    assert.equal(hasPlan(store, 'org_a', 'STARTER'), false)
  })

  it('4. ACTIVE subscription counts as active', () => {
    const store = makeStore([{ organizationId: 'o', plan: 'STARTER', status: 'ACTIVE' }])
    assert.equal(hasActiveSubscription(store, 'o'), true)
  })

  it('5. TRIALING subscription counts as active', () => {
    const store = makeStore([{ organizationId: 'o', plan: 'STARTER', status: 'TRIALING' }])
    assert.equal(hasActiveSubscription(store, 'o'), true)
  })

  it('6. CANCELED subscription is not active (nor are INCOMPLETE/UNPAID/EXPIRED)', () => {
    for (const status of ['CANCELED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID'] as Status[]) {
      const store = makeStore([{ organizationId: 'o', plan: 'STARTER', status }])
      assert.equal(hasActiveSubscription(store, 'o'), false, status)
      assert.equal(hasPlan(store, 'o', 'STARTER'), false, `${status} blocks hasPlan`)
    }
  })

  it('7. PAST_DUE follows strict semantics (grace state, no access)', () => {
    const store = makeStore([{ organizationId: 'o', plan: 'PROFESSIONAL', status: 'PAST_DUE' }])
    assert.equal(hasActiveSubscription(store, 'o'), false)
    assert.equal(hasPlan(store, 'o', 'PROFESSIONAL'), false)
    assert.equal(getCurrentPlan(store, 'o'), 'PROFESSIONAL', 'plan still readable for dunning UX')
  })

  it('8. current plan retrieval + hasPlan gating', () => {
    const store = makeStore([{ organizationId: 'o', plan: 'ENTERPRISE', status: 'ACTIVE' }])
    assert.equal(getCurrentPlan(store, 'o'), 'ENTERPRISE')
    assert.equal(hasPlan(store, 'o', 'ENTERPRISE'), true)
    assert.equal(hasPlan(store, 'o', 'STARTER', 'PROFESSIONAL'), false)
    assert.equal(hasPlan(store, 'o'), false, 'empty plan list never matches')
  })

  it('9. cross-organization access is rejected (no row, no leak)', () => {
    const store = makeStore([{ organizationId: 'org_a', plan: 'STARTER', status: 'ACTIVE' }])
    assert.equal(getSubscription(store, 'org_b'), null)
    assert.equal(hasActiveSubscription(store, 'org_b'), false)
    assert.equal(getCurrentPlan(store, 'org_b'), null)
  })

  it('10/11. webhook event uniqueness: same event cannot be inserted twice', () => {
    const store = makeStore()
    const row = { provider: 'stripe', providerEventId: 'evt_123' }
    assert.equal(insertWebhookEvent(store, row), true, 'first insert succeeds')
    assert.equal(insertWebhookEvent(store, row), false, 'replay rejected')
    assert.equal(
      insertWebhookEvent(store, { provider: 'stripe', providerEventId: 'evt_456' }),
      true, 'different event id accepted',
    )
    assert.equal(
      insertWebhookEvent(store, { provider: 'paddle', providerEventId: 'evt_123' }),
      true, 'same id under another provider accepted',
    )
    assert.equal(store.events.length, 3)
  })
})

// ── 12–13 + source contracts ───────────────────────────────────────

describe('BILLING SOURCE CONTRACT', () => {
  it('12/13. Payment and Invoice models are untouched', () => {
    const src = read('prisma/schema.prisma')
    const paymentBlock = src.match(/model Payment \{[\s\S]*?\n\}/)?.[0] ?? ''
    const invoiceBlock = src.match(/model Invoice \{[\s\S]*?\n\}/)?.[0] ?? ''
    for (const [name, block] of [['Payment', paymentBlock], ['Invoice', invoiceBlock]] as const) {
      assert.ok(!block.includes('ubscription'), `${name} has no subscription reference`)
      assert.ok(!block.includes('plan'), `${name} has no plan reference`)
    }
  })

  it('Subscription model: org-owned, unique per org, provider lookups', () => {
    const src = read('prisma/schema.prisma')
    assert.ok(src.includes('model Subscription {'), 'model exists')
    assert.ok(/organizationId\s+String\s+@unique/.test(src), 'one subscription per org')
    assert.ok(src.includes('providerSubscriptionId String?          @unique') || src.includes('providerSubscriptionId String?'), 'provider id field')
    assert.ok(src.includes('@@index([provider, providerCustomerId])'), 'provider lookup index')
    assert.ok(src.includes('onDelete: Cascade'), 'org cascade present')
    assert.ok(src.includes('cancelAtPeriodEnd'), 'cancel flag present')
    assert.ok(src.includes('trialEnd'), 'trial field present')
  })

  it('SubscriptionStatus/SubscriptionPlan enums follow schema conventions', () => {
    const src = read('prisma/schema.prisma')
    for (const s of ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID']) {
      assert.ok(src.includes(s), `status ${s}`)
    }
    for (const p of ['STARTER', 'PROFESSIONAL', 'ENTERPRISE']) {
      assert.ok(src.includes(p), `plan ${p}`)
    }
  })

  it('BillingWebhookEvent: unique provider event id + payload + indexes', () => {
    const src = read('prisma/schema.prisma')
    assert.ok(src.includes('model BillingWebhookEvent {'), 'model exists')
    assert.ok(src.includes('@@unique([provider, providerEventId])'), 'idempotency constraint')
    assert.ok(src.includes('payload'), 'payload storage')
    assert.ok(src.includes('processedAt'), 'processed marker')
  })

  it('migration creates only billing objects', () => {
    const sql = read('prisma/migrations/20260921120000_add_saas_billing_foundation/migration.sql')
    assert.ok(sql.includes('CREATE TABLE "subscriptions"'), 'subscriptions table')
    assert.ok(sql.includes('CREATE TABLE "billing_webhook_events"'), 'events table')
    assert.ok(sql.includes('CREATE TYPE "SubscriptionStatus"'), 'status enum')
    assert.ok(sql.includes('CREATE TYPE "SubscriptionPlan"'), 'plan enum')
    assert.ok(!sql.includes('ALTER TABLE "commandes"'), 'no commande changes')
    assert.ok(!sql.includes('ALTER TABLE "payments"'), 'no payment changes')
    assert.ok(!sql.includes('ALTER TABLE "invoices"'), 'no invoice changes')
    assert.ok(!sql.includes('DROP'), 'nothing dropped')
  })

  it('follow-up migration links webhook events to organizations (no other changes)', () => {
    const sql = read('prisma/migrations/20260921130000_add_billing_event_org_link/migration.sql')
    assert.ok(sql.includes('ADD COLUMN "organizationId"'), 'adds the org link')
    assert.ok(sql.includes('billing_webhook_events_organizationId_fkey'), 'FK with cascade')
    assert.ok(!sql.includes('CREATE TABLE'), 'no new tables')
    assert.ok(!sql.includes('DROP'), 'nothing dropped')
  })

  it('helpers resolve org from membership and scope every query', () => {
    const src = read('features/billing/lib/billing.ts')
    assert.ok(src.includes('getCurrentMembership()'), 'server-side identity only')
    assert.ok(!src.includes('organizationId?: string') || src.includes('membership.organizationId'), 'no client orgId authority')
    const scoped = (src.match(/organizationId: membership\.organizationId/g) ?? []).length
    assert.ok(scoped >= 1, 'org scoping present')
    assert.ok(src.includes('TRIALING') && src.includes('ACTIVE'), 'active semantics documented')
  })

  it('Organization reverse relations do not disturb existing models', () => {
    const src = read('prisma/schema.prisma')
    assert.ok(src.includes('subscriptions Subscription[]'), 'org reverse relation')
    assert.ok(src.includes('billingWebhookEvents BillingWebhookEvent[]'), 'org events relation')
  })
})
