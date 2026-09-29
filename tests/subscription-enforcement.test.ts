/**
 * P0-1 subscription enforcement — execution tests (no DB, no network).
 *
 * Executes the real entitlement code (isEntitledStatus,
 * requireActiveSubscription, subscriptionDenialResponse) with injected
 * membership/subscription fakes. The Clerk session boundary
 * (getCurrentMembership) and Prisma are the only injected seams; production
 * never passes overrides, so the tested decision logic is the shipped logic.
 * Wiring (layout redirect, guard flag, API gates) is verified by contracts
 * on the exact call sites, since routes/layouts need a Next request scope.
 *
 * Run: npx tsx tests/subscription-enforcement.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import {
  isEntitledStatus,
  requireActiveSubscription,
  subscriptionDenialResponse,
  SubscriptionRequiredError,
} from '../src/features/billing/lib/billing.js'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

function membership(org = 'org_a', role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'SUPERADMIN' = 'OWNER') {
  return { organizationId: org, role, userId: 'user_1' } as const
}

function subscription(org = 'org_a', status: string = 'ACTIVE') {
  return {
    id: 'sub_1',
    organizationId: org,
    provider: 'charipay',
    providerCustomerId: null,
    providerSubscriptionId: null,
    plan: 'STARTER',
    status,
    priceId: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    trialEnd: null,
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as never
}

describe('ENTITLEMENT: status matrix (real decision function)', () => {
  it('1. ACTIVE and TRIALING grant access', () => {
    assert.equal(isEntitledStatus('ACTIVE' as never), true)
    assert.equal(isEntitledStatus('TRIALING' as never), true)
  })

  it('2-5. INCOMPLETE, PAST_DUE, CANCELED, UNPAID, INCOMPLETE_EXPIRED and null deny', () => {
    for (const s of ['INCOMPLETE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE_EXPIRED', null, undefined]) {
      assert.equal(isEntitledStatus(s as never), false, `${String(s)} must not entitle`)
    }
  })

  it('3. PAST_DUE is explicitly denied (no grace period invented)', async () => {
    await assert.rejects(
      requireActiveSubscription({ membership: membership(), subscription: subscription('org_a', 'PAST_DUE') }),
      (err: unknown) => err instanceof SubscriptionRequiredError,
    )
  })
})

describe('ENTITLEMENT: requireActiveSubscription decisions (real execution)', () => {
  it('1. ACTIVE subscription resolves the organization context', async () => {
    const ctx = await requireActiveSubscription({ membership: membership(), subscription: subscription() })
    assert.equal(ctx.organizationId, 'org_a')
  })

  it('2. INCOMPLETE throws SubscriptionRequiredError', async () => {
    await assert.rejects(
      requireActiveSubscription({ membership: membership(), subscription: subscription('org_a', 'INCOMPLETE') }),
      (err: unknown) => err instanceof SubscriptionRequiredError && err.code === 'SUBSCRIPTION_REQUIRED',
    )
  })

  it('4. CANCELED throws SubscriptionRequiredError', async () => {
    await assert.rejects(
      requireActiveSubscription({ membership: membership(), subscription: subscription('org_a', 'CANCELED') }),
      SubscriptionRequiredError,
    )
  })

  it('5. missing subscription row throws SubscriptionRequiredError', async () => {
    await assert.rejects(
      requireActiveSubscription({ membership: membership(), subscription: null }),
      SubscriptionRequiredError,
    )
  })

  it('6. unauthenticated caller fails at the auth boundary, never entitled', async () => {
    // No overrides: getCurrentMembership() hits Clerk outside a request
    // scope and rejects. The guard must reject, never resolve access.
    await assert.rejects(requireActiveSubscription())
  })

  it('7-8. cross-tenant subscription can never grant access; no client orgId exists', async () => {
    await assert.rejects(
      requireActiveSubscription({ membership: membership('org_a'), subscription: subscription('org_b', 'ACTIVE') }),
      SubscriptionRequiredError,
      'orgB subscription must not entitle orgA',
    )
    const src = read('src/features/billing/lib/billing.ts')
    assert.ok(!src.includes('organizationId?: string'), 'no client-supplied org id parameter')
    assert.ok(src.includes('getCurrentMembership()'), 'membership always server-resolved')
  })

  it('SUPERADMIN bypasses tenant billing state (mirrors assertCan)', async () => {
    const ctx = await requireActiveSubscription({
      membership: membership('org_a', 'SUPERADMIN'),
      subscription: null,
    })
    assert.equal(ctx.organizationId, 'org_a')
  })

  it('MEMBER of an entitled org is entitled (role is RBAC business, not billing)', async () => {
    const ctx = await requireActiveSubscription({ membership: membership('org_a', 'MEMBER'), subscription: subscription() })
    assert.equal(ctx.organizationId, 'org_a')
  })
})

describe('ENTITLEMENT: HTTP/API surface (real execution)', () => {
  it('9. denial maps to a 403 JSON response; entitled maps to null', async () => {
    const denied = await subscriptionDenialResponse({
      membership: membership(),
      subscription: subscription('org_a', 'CANCELED'),
    })
    assert.ok(denied !== null, 'denied request gets a response')
    assert.equal(denied?.status, 403)
    const body = (await denied?.json()) as { error?: string }
    assert.match(body.error ?? '', /Abonnement requis/)
  })

  it('entitled request passes through (null)', async () => {
    const pass = await subscriptionDenialResponse({ membership: membership(), subscription: subscription() })
    assert.equal(pass, null)
  })
})

describe('ENTITLEMENT: wiring contracts', () => {
  it('10. mutating server actions stay behind the guard (no opt-out except billing)', () => {
    const guard = read('src/lib/action-guard.ts')
    assert.ok(guard.includes('requireSubscription !== false'), 'default-deny for authed actions')
    assert.ok(guard.includes('BILLING.SUBSCRIPTION_REQUIRED'), 'deterministic denial message')
    const exempted: string[] = []
    const flagged: string[] = []
    const files: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(resolve(ROOT, dir), { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith('.ts')) files.push(full)
      }
    }
    walk('src/features')
    const posix = (p: string) => p.replace(/\\/g, '/')
    for (const f of files) {
      if (!f.includes('/actions/') && !f.includes('\\actions\\')) continue
      const src = read(posix(f))
      if (!src.includes('withActionGuard(')) continue
      if (src.includes('public: true')) continue
      if (src.includes('requireSubscription: false')) exempted.push(posix(f))
      else flagged.push(posix(f))
    }
    assert.deepEqual(
      exempted.sort(),
      [
        'src/features/billing/actions/billing-checkout.ts',
        'src/features/billing/actions/billing-portal.ts',
      ].sort(),
      'only the billing purchase/management path is exempt',
    )
    assert.ok(flagged.length > 30, `expected broad enforcement, got ${flagged.length} guarded actions`)
  })

  it('dashboard layout redirects inactive orgs to /billing without loops', () => {
    const layout = read('src/app/dashboard/layout.tsx')
    assert.ok(layout.includes("redirect('/billing')"), 'inactive lands on billing')
    assert.ok(layout.includes('SubscriptionRequiredError'), 'only entitlement denials redirect')
    assert.ok(!read('src/app/billing/page.tsx').includes('requireActiveSubscription'), 'billing page never gates itself')
  })

  it('11-12. billing/checkout and public pages stay reachable when inactive', () => {
    const checkout = read('src/features/billing/actions/charipay-checkout.ts')
    assert.ok(checkout.includes('public: true'), 'public checkout needs no session at all')
    const proxy = read('src/proxy.ts')
    for (const open of ['/billing', '/checkout', '/tarifs', '/sign-in', '/activate', '/accept-invite']) {
      assert.ok(!proxy.includes(`"${open}`), `${open} stays outside middleware auth`)
    }
    for (const hook of ['webhooks/charipay', 'webhooks/clerk', 'webhooks/lemonsqueezy']) {
      assert.ok(!read(`src/app/api/${hook}/route.ts`).includes('requireActiveSubscription'), `${hook} stays public`)
    }
  })
})
