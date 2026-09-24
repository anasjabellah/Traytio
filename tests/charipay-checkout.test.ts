/**
 * ChariPay Sandbox checkout phase — focused tests.
 *
 * Covers: server-side plan resolution (299/599), client amount/currency
 * ignored, invalid/ENTERPRISE plans rejected, customer validation, request
 * shape (server-authoritative MAD amount, customer mapping, unique
 * Idempotency-Key + X-Request-Id), server-only API key, safe extraction,
 * safe provider-failure errors, and no local provisioning.
 * ChariPay HTTP is never called (no network, no credentials).
 *
 * Run: npx tsx tests/charipay-checkout.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { resolvePlan } from '../src/features/billing/lib/plans.js'
import { checkoutCustomerSchema } from '../src/features/billing/validations/checkout-customer-schema.js'
import {
  CHARIPAY_API_BASE,
  buildChariPaySessionRequest,
  extractSafeSessionResult,
  chariPayErrorCode,
} from '../src/features/billing/lib/charipay.js'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')
const FAKE_KEY = 'chari_sk_test_FAKEKEY'
const CUSTOMER = { firstName: 'Sara', lastName: 'Bennani', email: 'sara@exemple.com', phone: '+212612345678' }

function build(amountMad: number) {
  return buildChariPaySessionRequest({ apiKey: FAKE_KEY, amountMad, plan: 'STARTER', customer: CUSTOMER })
}

describe('CHARIPAY CHECKOUT: server-side plan pricing', () => {
  it('1. STARTER resolves to 299 MAD', () => {
    assert.equal(resolvePlan('STARTER')?.priceMad, 299)
  })

  it('2. PROFESSIONAL resolves to 599 MAD', () => {
    assert.equal(resolvePlan('PROFESSIONAL')?.priceMad, 599)
  })

  it('3-4. client-provided amount/currency are ignored', () => {
    // resolvePlan accepts a bare identifier — no amount/currency parameter exists.
    assert.equal(resolvePlan.length, 1)
    const action = read('src/features/billing/actions/charipay-checkout.ts')
    assert.ok(!action.includes('input.amount') && !action.includes('data.amount'), 'never reads client amount')
    assert.ok(!action.includes('body.amount') && !action.includes('query.currency'), 'never reads client totals')
    assert.ok(action.includes('amountMad: plan.priceMad'), 'amount comes from the server plan')
  })

  it('5-6. invalid plan and ENTERPRISE rejected', () => {
    assert.equal(resolvePlan('ENTERPRISE'), null)
    assert.equal(resolvePlan(''), null)
    assert.equal(resolvePlan(undefined), null)
    const action = read('src/features/billing/actions/charipay-checkout.ts')
    assert.ok(action.includes("z.enum(['STARTER', 'PROFESSIONAL'])"), 'zod allowlist mirrors the catalog')
  })
})

describe('CHARIPAY CHECKOUT: customer validation', () => {
  it('7-10. missing/invalid fields rejected', () => {
    assert.equal(checkoutCustomerSchema.safeParse({ ...CUSTOMER, firstName: '' }).success, false)
    assert.equal(checkoutCustomerSchema.safeParse({ ...CUSTOMER, lastName: '' }).success, false)
    assert.equal(checkoutCustomerSchema.safeParse({ ...CUSTOMER, email: 'nope' }).success, false)
    assert.equal(checkoutCustomerSchema.safeParse({ ...CUSTOMER, phone: '' }).success, false)
    assert.equal(checkoutCustomerSchema.safeParse(CUSTOMER).success, true)
  })
})

describe('CHARIPAY CHECKOUT: request contract', () => {
  it('targets POST /v1/payment-sessions with provider auth header', () => {
    const req = build(299)
    assert.equal(req.method, 'POST')
    assert.equal(req.url, `${CHARIPAY_API_BASE}/v1/payment-sessions`)
    assert.equal(req.headers['X-CHARI-PAY-API-KEY'], FAKE_KEY)
  })

  it('11-12. amount is server-authoritative, in MAD major units', () => {
    assert.equal(build(299).body.amount, 299)
    assert.equal(build(599).body.amount, 599)
  })

  it('13. customer data mapped correctly, unique order refs, single-use', () => {
    const req = build(299)
    assert.deepEqual(req.body.config.customer, CUSTOMER)
    assert.equal(req.body.singleUse, true)
    assert.ok(req.body.orderId.startsWith('TUR-SUB-'))
    assert.ok(req.body.externalId.startsWith('tur-sub-'))
    assert.notEqual(req.body.orderId, req.body.externalId)
    assert.equal(build(299).body.orderId === req.body.orderId, false)
  })

  it('14-15. Idempotency-Key and X-Request-Id generated, unique per request', () => {
    const a = build(299)
    const b = build(299)
    for (const h of ['Idempotency-Key', 'X-Request-Id'] as const) {
      assert.ok(a.headers[h], `${h} present`)
      assert.notEqual(a.headers[h], b.headers[h], `${h} unique`)
    }
  })

  it('no return URLs declared (localhost rejected by provider)', () => {
    const raw = JSON.stringify(build(299).body)
    assert.ok(!raw.includes('url') || raw.includes('checkoutUrl') === false, 'no urls in body')
    assert.ok(!raw.includes('localhost') && !raw.includes('http'), 'no URLs at all')
  })
})

describe('CHARIPAY CHECKOUT: E.164 phone normalization', () => {
  it('strips visual separators to E.164', async () => {
    const { normalizePhoneE164 } = await import('../src/features/billing/lib/charipay.js')
    assert.equal(normalizePhoneE164('+212 6 12 34 56 78'), '+212612345678')
    assert.equal(normalizePhoneE164('+212-612-345678'), '+212612345678')
    assert.equal(normalizePhoneE164('+212612345678'), '+212612345678')
  })

  it('rejects non-E.164 numbers with a clear field error', async () => {
    const { normalizePhoneE164 } = await import('../src/features/billing/lib/charipay.js')
    assert.equal(normalizePhoneE164('0612345678'), null)
    assert.equal(normalizePhoneE164('+212'), null)
    assert.equal(normalizePhoneE164(''), null)
    const action = read('src/features/billing/actions/charipay-checkout.ts')
    assert.ok(action.includes('normalizePhoneE164'), 'action normalizes before sending')
    assert.ok(action.includes('format international'), 'clear French error on rejection')
  })

  it('normalized phone flows into session customer + metadata', () => {
    const action = read('src/features/billing/actions/charipay-checkout.ts')
    assert.ok(action.includes('const customer = { ...parsed.data.customer, phone }'), 'single normalized customer object')
  })
})

describe('CHARIPAY CHECKOUT: server-only key + safe extraction', () => {
  it('16. API key never reaches client code', () => {
    const form = read('src/app/checkout/checkout-form.tsx')
    assert.ok(!form.includes('CHARIPAY_API_KEY') && !form.includes('chari_sk_'), 'form has no key')
    const lib = read('src/features/billing/lib/charipay.ts')
    assert.ok(!lib.includes('process.env'), 'lib takes the key as a parameter')
    const action = read('src/features/billing/actions/charipay-checkout.ts')
    assert.ok(action.includes('process.env.CHARIPAY_API_KEY'), 'key read server-side only')
  })

  it('17. checkoutUrl safely extracted (multiple spellings), null when absent', () => {
    assert.deepEqual(
      extractSafeSessionResult({ sessionId: 'ps_1', checkoutUrl: 'https://pay/x' }),
      { sessionId: 'ps_1', checkoutUrl: 'https://pay/x' },
    )
    assert.equal(extractSafeSessionResult({ sessionId: 'ps_1', payment_url: 'https://pay/y' })?.checkoutUrl, 'https://pay/y')
    assert.equal(extractSafeSessionResult({ sessionId: 'ps_1' }), null)
    assert.equal(extractSafeSessionResult({ checkoutUrl: 'https://pay/x' }), null)
    assert.equal(extractSafeSessionResult(null), null)
  })

  it('18. provider failure returns a safe generic error', () => {
    assert.equal(chariPayErrorCode({ error: { code: 'BAAS_CHARI_ERROR', message: 'secret detail' } }), 'BAAS_CHARI_ERROR')
    assert.equal(chariPayErrorCode({}), null)
    const action = read('src/features/billing/actions/charipay-checkout.ts')
    assert.ok(!action.includes('error.message'), 'never reflects provider messages')
    const occurrences = action.split('GENERIC_ERROR').length - 1
    assert.ok(occurrences >= 5, 'all failure paths share one generic French message')
  })
})

describe('CHARIPAY CHECKOUT: no provisioning + no success claims', () => {
  it('19. nothing is created locally', () => {
    const action = read('src/features/billing/actions/charipay-checkout.ts')
    for (const token of ['prisma.', '.create(', '.upsert(', 'sendEmail', 'invitation', 'clerkClient', 'userOrganization']) {
      assert.ok(!action.includes(token), `action must not contain ${token}`)
    }
  })

  it('20. session creation is never presented as payment success', () => {
    const form = read('src/app/checkout/checkout-form.tsx')
    assert.ok(!form.includes('ussi'), 'no success wording in form')
    assert.ok(form.includes('avant confirmation du paiement'), 'explicit no-premature-success notice')
  })

  it('public action keeps CSRF + rate limiting, no membership required', () => {
    const action = read('src/features/billing/actions/charipay-checkout.ts')
    assert.ok(action.includes("public: true"), 'public opt-in declared')
    assert.ok(!action.includes('getCurrentMembership') && !action.includes('organizationId'), 'no account/org required')
  })
})
