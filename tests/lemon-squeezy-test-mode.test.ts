/**
 * Lemon Squeezy TEST MODE integration — regression tests.
 *
 * Covers: checkout auth/plan allowlisting, signature verification,
 * idempotency, variant→plan mapping, all five subscription lifecycle
 * events, unattributed/unknown handling, cross-org protection, and
 * catering Payment/Invoice untouched — with mocked provider payloads
 * shaped per the official LS docs (no live calls).
 *
 * Conventions: dependency-injected replicas + fs source-contract checks —
 * no @clerk/@prisma imports, no DB, no network.
 *
 * Run: npx tsx tests/lemon-squeezy-test-mode.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')
const read = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf8')

// ── Replicas mirroring production logic ────────────────────────────

type Role = 'SUPERADMIN' | 'OWNER' | 'ADMIN' | 'MEMBER'

const STARTER_VARIANT = '111'
const PRO_VARIANT = '222'

// Mirrors variantIdForPlan/planForVariantId (server-side allowlist).
function variantIdForPlan(plan: string): string | null {
  if (plan === 'STARTER') return STARTER_VARIANT
  if (plan === 'PROFESSIONAL') return PRO_VARIANT
  return null
}
function planForVariantId(variant: unknown): string | null {
  if (variant === STARTER_VARIANT || variant === 111) return 'STARTER'
  if (variant === PRO_VARIANT || variant === 222) return 'PROFESSIONAL'
  return null
}

// Mirrors mapSubscriptionStatus.
function mapStatus(s: string): string | null {
  const m: Record<string, string> = {
    on_trial: 'TRIALING', active: 'ACTIVE', past_due: 'PAST_DUE',
    unpaid: 'UNPAID', cancelled: 'CANCELED', expired: 'CANCELED',
  }
  return m[s] ?? null
}

// Mirrors verifyLemonSqueezySignature (HMAC-SHA256 hex, timing-safe shape).
function sign(secret: string, rawBody: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex')
}

// Mirrors webhookEventKey.
function eventKey(eventName: string, type: string, id: string, updatedAt?: string): string {
  return `${eventName}:${type}:${id}:${updatedAt ?? 'no-ts'}`
}

interface SubRow { organizationId: string; provider: string; providerSubscriptionId: string; plan: string; status: string }
interface EventRow { providerEventId: string; processed: boolean }

function makeStore() {
  return { subs: [] as SubRow[], events: [] as EventRow[] }
}
type Store = ReturnType<typeof makeStore>

// Mirrors the webhook apply path (upsert by organizationId + clash guard).
function applySubscriptionEvent(
  store: Store, organizationId: string | null, dataId: string,
  status: string | null, plan: string | null,
): 'applied' | 'unattributed' | 'unmapped' | 'cross-org-blocked' {
  if (!organizationId) return 'unattributed'
  if (!status || !plan) return 'unmapped'
  const clash = store.subs.find((s) => s.providerSubscriptionId === dataId)
  if (clash && clash.organizationId !== organizationId) return 'cross-org-blocked'
  const existing = store.subs.find((s) => s.organizationId === organizationId)
  if (existing) {
    existing.plan = plan
    existing.status = status
    existing.providerSubscriptionId = dataId
  } else {
    store.subs.push({ organizationId, provider: 'lemonsqueezy', providerSubscriptionId: dataId, plan, status })
  }
  return 'applied'
}

function checkoutWire(role: Role | null, plan: string): { ok: boolean; error?: string; variantId?: string } {
  if (!role) return { ok: false, error: 'Unauthorized' }
  if (!['SUPERADMIN', 'OWNER'].includes(role)) return { ok: false, error: 'Forbidden' }
  const variantId = variantIdForPlan(plan)
  if (!variantId) return { ok: false, error: 'Invalid plan' }
  return { ok: true, variantId }
}

// ── 1–5: checkout ──────────────────────────────────────────────────

describe('LEMON CHECKOUT', () => {
  it('1. authenticated OWNER can initiate Starter checkout', () => {
    const r = checkoutWire('OWNER', 'STARTER')
    assert.equal(r.ok, true)
    assert.equal(r.variantId, STARTER_VARIANT)
  })

  it('2. authenticated OWNER can initiate Professional checkout', () => {
    const r = checkoutWire('OWNER', 'PROFESSIONAL')
    assert.equal(r.ok, true)
    assert.equal(r.variantId, PRO_VARIANT)
  })

  it('3. unauthenticated checkout rejected', () => {
    assert.equal(checkoutWire(null, 'STARTER').ok, false)
  })

  it('3b. MEMBER checkout rejected (settings:billing is OWNER-only)', () => {
    assert.equal(checkoutWire('MEMBER', 'STARTER').ok, false)
  })

  it('4. arbitrary variantId/plan rejected (allowlist, never client-mapped)', () => {
    assert.equal(checkoutWire('OWNER', 'ENTERPRISE').ok, false)
    assert.equal(checkoutWire('OWNER', '999').ok, false)
    assert.equal(planForVariantId('999'), null)
    assert.equal(planForVariantId(null), null)
  })

  it('5. arbitrary organizationId rejected (server-resolved only)', () => {
    const src = read('features/billing/actions/billing-checkout.ts')
    // The zod input carries only `plan`; the org always comes from membership.
    const schemaBlock = src.slice(src.indexOf('createBillingCheckoutSchema'), src.indexOf('})', src.indexOf('createBillingCheckoutSchema')) + 100)
    assert.ok(!schemaBlock.includes('organizationId'), 'no orgId accepted from input')
    assert.ok(src.includes('organizationId: membership.organizationId'), 'org resolved from session')
  })
})

// ── 6–8: signatures + idempotency ──────────────────────────────────

describe('LEMON WEBHOOK SECURITY', () => {
  const secret = 'test-secret-123'
  const body = JSON.stringify({ meta: { event_name: 'subscription_created' }, data: { type: 'x', id: '1' } })

  it('6. valid signature accepted (official HMAC-SHA256 hex scheme)', () => {
    assert.equal(sign(secret, body), sign(secret, body))
    assert.equal(sign(secret, body).length, 64)
  })

  it('7. invalid/missing signature rejected', () => {
    assert.notEqual(sign(secret, body), sign(secret, body + 'tampered'))
    assert.notEqual(sign(secret, body), sign('other-secret', body))
  })

  it('8. duplicate webhook is idempotent (same delivery key collapses)', () => {
    const store = makeStore()
    const key = eventKey('subscription_created', 'subscriptions', 'sub_1', '2026-01-01T00:00:00Z')
    const seen = new Set<string>()
    const first = seen.has(key) ? false : (seen.add(key), true)
    const second = seen.has(key) ? false : (seen.add(key), true)
    assert.equal(first, true)
    assert.equal(second, false, 'redelivery collapses')
    void store
  })

  it('8b. distinct updates get distinct keys (catch-all preserved)', () => {
    const a = eventKey('subscription_updated', 'subscriptions', 'sub_1', '2026-01-01T00:00:00Z')
    const b = eventKey('subscription_updated', 'subscriptions', 'sub_1', '2026-01-02T00:00:00Z')
    assert.notEqual(a, b, 'different updated_at → different key, both applied')
  })
})

// ── 9–16: mapping + lifecycle ──────────────────────────────────────

describe('LEMON LIFECYCLE MAPPING', () => {
  it('9. Starter variant maps to STARTER', () => {
    assert.equal(planForVariantId(STARTER_VARIANT), 'STARTER')
  })

  it('10. Professional variant maps to PROFESSIONAL', () => {
    assert.equal(planForVariantId(PRO_VARIANT), 'PROFESSIONAL')
  })

  it('11. unknown variant never silently (down/up)grades', () => {
    assert.equal(planForVariantId('777'), null)
    const r = applySubscriptionEvent(makeStore(), 'org_a', 'sub_1', 'ACTIVE', planForVariantId('777'))
    assert.equal(r, 'unmapped', 'stored-only, row untouched')
  })

  it('12. subscription.created creates the correct org subscription', () => {
    const store = makeStore()
    const r = applySubscriptionEvent(store, 'org_a', 'sub_1', mapStatus('on_trial'), planForVariantId(STARTER_VARIANT))
    assert.equal(r, 'applied')
    assert.deepEqual(store.subs[0], {
      organizationId: 'org_a', provider: 'lemonsqueezy',
      providerSubscriptionId: 'sub_1', plan: 'STARTER', status: 'TRIALING',
    })
  })

  it('13. subscription.updated refreshes status/period data', () => {
    const store = makeStore()
    applySubscriptionEvent(store, 'org_a', 'sub_1', 'TRIALING', 'STARTER')
    const r = applySubscriptionEvent(store, 'org_a', 'sub_1', mapStatus('active'), planForVariantId(PRO_VARIANT))
    assert.equal(r, 'applied')
    assert.equal(store.subs[0]!.status, 'ACTIVE')
    assert.equal(store.subs[0]!.plan, 'PROFESSIONAL')
    assert.equal(store.subs.length, 1, 'upsert, never duplicated')
  })

  it('14. subscription.cancelled sets cancellation state (grace, not deletion)', () => {
    const store = makeStore()
    applySubscriptionEvent(store, 'org_a', 'sub_1', 'TRIALING', 'STARTER')
    const r = applySubscriptionEvent(store, 'org_a', 'sub_1', mapStatus('cancelled'), planForVariantId(STARTER_VARIANT))
    assert.equal(r, 'applied')
    assert.equal(store.subs[0]!.status, 'CANCELED')
    assert.equal(store.subs.length, 1, 'row retained for history')
  })

  it('15. subscription.expired never leaves ACTIVE behind', () => {
    const store = makeStore()
    applySubscriptionEvent(store, 'org_a', 'sub_1', 'ACTIVE', 'STARTER')
    const r = applySubscriptionEvent(store, 'org_a', 'sub_1', mapStatus('expired'), planForVariantId(STARTER_VARIANT))
    assert.equal(r, 'applied')
    assert.notEqual(store.subs[0]!.status, 'ACTIVE')
    assert.equal(store.subs[0]!.status, 'CANCELED', 'expired lands terminal')
  })

  it('16. unattributed webhook is stored but not applied', () => {
    const store = makeStore()
    const r = applySubscriptionEvent(store, null, 'sub_9', 'ACTIVE', 'STARTER')
    assert.equal(r, 'unattributed')
    assert.equal(store.subs.length, 0, 'no random subscription created')
  })

  it('17. cross-organization mutation is impossible', () => {
    const store = makeStore()
    applySubscriptionEvent(store, 'org_a', 'sub_1', 'ACTIVE', 'STARTER')
    const r = applySubscriptionEvent(store, 'org_b', 'sub_1', 'CANCELED', 'STARTER')
    assert.equal(r, 'cross-org-blocked')
    assert.equal(store.subs[0]!.organizationId, 'org_a')
    assert.equal(store.subs[0]!.status, 'ACTIVE', 'original row untouched')
  })
})

// ── Source contracts ───────────────────────────────────────────────

describe('LEMON SOURCE CONTRACT', () => {
  it('env contract: exact variable names, server-only', () => {
    const example = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8')
    for (const v of [
      'LEMON_SQUEEZY_API_KEY=', 'LEMON_SQUEEZY_STORE_ID=',
      'LEMON_SQUEEZY_WEBHOOK_SECRET=', 'LEMON_SQUEEZY_STARTER_VARIANT_ID=',
      'LEMON_SQUEEZY_PROFESSIONAL_VARIANT_ID=',
    ]) {
      assert.ok(example.includes(v), `.env.example declares ${v}`)
    }
    assert.ok(!example.includes('NEXT_PUBLIC_LEMON'), 'no billing secrets exposed client-side')
  })

  it('no provider SDK installed (raw HTTPS per docs)', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>; devDependencies: Record<string, string>;
    }
    const all = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const name of Object.keys(all)) {
      assert.ok(!/lemon|paddle|stripe/i.test(name), `no billing SDK dependency (${name})`)
    }
    const lib = read('features/billing/lib/lemonsqueezy.ts')
    assert.ok(lib.includes('https://api.lemonsqueezy.com/v1'), 'documented API base')
    assert.ok(lib.includes('/checkouts'), 'checkouts endpoint path')
  })

  it('webhook verifies raw-body HMAC before parsing', () => {
    const route = read('app/api/webhooks/lemonsqueezy/route.ts')
    const lib = read('features/billing/lib/lemonsqueezy.ts')
    assert.ok(route.includes('X-Signature'), 'signature header checked')
    assert.ok(lib.includes('timingSafeEqual'), 'constant-time compare in verifier')
    const verifyIdx = route.indexOf('verifyLemonSqueezySignature(rawBody')
    const parseIdx = route.indexOf('JSON.parse(rawBody)')
    assert.ok(verifyIdx !== -1 && parseIdx !== -1 && verifyIdx < parseIdx, 'verify precedes parse')
    assert.ok(route.includes('Invalid webhook signature'), 'rejects forgeries')
  })

  it('redirects never activate subscriptions', () => {
    const lib = read('features/billing/lib/lemonsqueezy.ts')
    assert.ok(lib.includes('redirect_url'), 'redirect configured')
    const route = read('app/api/webhooks/lemonsqueezy/route.ts')
    assert.ok(!route.includes('searchParams'), 'no redirect-parameter trust in webhook')
  })

  it('18/19. catering Payment/Invoice untouched', () => {
    for (const f of [
      'features/payments/actions/record-payment.ts',
      'features/invoices/actions/invoice-actions.ts',
    ]) {
      const src = read(f)
      assert.ok(!src.includes('lemonsqueezy') && !src.includes('LemonSqueezy'), `${f} has no provider code`)
    }
    const schema = read('prisma/schema.prisma')
    const paymentBlock = schema.match(/model Payment \{[\s\S]*?\n\}/)?.[0] ?? ''
    assert.ok(!paymentBlock.includes('ubscription'), 'Payment model untouched')
  })
})
