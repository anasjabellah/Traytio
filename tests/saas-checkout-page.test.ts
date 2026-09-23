/**
 * SaaS checkout page phase — focused tests.
 *
 * Covers: STARTER/PROFESSIONAL accepted, ENTERPRISE + invalid rejected,
 * client price control impossible (server allowlist only), 299/599 MAD
 * resolution, customer validation (email/phone/names), Pricing links.
 * No provider, payment, or provisioning coverage (later phases).
 *
 * Run: npx tsx tests/saas-checkout-page.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { resolvePlan, BILLING_PLANS } from '../src/features/billing/lib/plans.js'
import { checkoutCustomerSchema } from '../src/features/billing/validations/checkout-customer-schema.js'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

const VALID = { firstName: 'Sara', lastName: 'Bennani', email: 'Sara@Exemple.com ', phone: '+212612345678' }

describe('CHECKOUT: plan allowlist', () => {
  it('1. STARTER is accepted', () => {
    assert.equal(resolvePlan('STARTER')?.id, 'STARTER')
  })

  it('2. PROFESSIONAL is accepted', () => {
    assert.equal(resolvePlan('PROFESSIONAL')?.id, 'PROFESSIONAL')
  })

  it('3. ENTERPRISE is rejected as purchasable', () => {
    assert.equal(resolvePlan('ENTERPRISE'), null)
  })

  it('4. invalid plans are rejected', () => {
    for (const bad of [undefined, null, '', 'starter', 'STARTER ', 'PRO', 299, {}, []]) {
      assert.equal(resolvePlan(bad), null, `must reject ${JSON.stringify(bad)}`)
    }
  })
})

describe('CHECKOUT: server-side pricing', () => {
  it('5. client cannot control the price (extra fields ignored)', () => {
    // resolvePlan takes a bare identifier — there is no amount parameter.
    assert.equal(resolvePlan.length, 1)
    const page = read('src/app/checkout/page.tsx')
    assert.ok(!page.includes('searchParams') || page.includes('plan'), 'page reads only plan from URL')
    assert.ok(!/amount|currency|interval/.test(page.split('resolvePlan')[0] ?? ''), 'no client pricing read before resolve')
  })

  it('6. STARTER resolves to 299 MAD', () => {
    assert.equal(BILLING_PLANS.STARTER.priceMad, 299)
    assert.equal(BILLING_PLANS.STARTER.currency, 'MAD')
    assert.equal(resolvePlan('STARTER')?.priceMad, 299)
  })

  it('7. PROFESSIONAL resolves to 599 MAD', () => {
    assert.equal(BILLING_PLANS.PROFESSIONAL.priceMad, 599)
    assert.equal(BILLING_PLANS.PROFESSIONAL.currency, 'MAD')
    assert.equal(resolvePlan('PROFESSIONAL')?.priceMad, 599)
  })

  it('checkout page never trusts amount/currency from the URL', () => {
    const page = read('src/app/checkout/page.tsx')
    assert.ok(!page.includes('.amount') && !page.includes("['amount']"), 'no amount value read')
    assert.ok(!page.includes('params.amount') && !page.includes('query.amount'), 'no amount param read')
    assert.ok(page.includes('notFound()'), 'invalid plans render not-found')
  })
})

describe('CHECKOUT: customer validation', () => {
  it('valid customer passes with normalized email', () => {
    const parsed = checkoutCustomerSchema.safeParse(VALID)
    assert.equal(parsed.success, true)
    if (parsed.success) assert.equal(parsed.data.email, 'sara@exemple.com')
  })

  it('8. invalid email rejected', () => {
    assert.equal(checkoutCustomerSchema.safeParse({ ...VALID, email: 'not-an-email' }).success, false)
    assert.equal(checkoutCustomerSchema.safeParse({ ...VALID, email: '' }).success, false)
  })

  it('9. phone required', () => {
    assert.equal(checkoutCustomerSchema.safeParse({ ...VALID, phone: '' }).success, false)
    assert.equal(checkoutCustomerSchema.safeParse({ ...VALID, phone: '123' }).success, false)
  })

  it('10. first name required', () => {
    assert.equal(checkoutCustomerSchema.safeParse({ ...VALID, firstName: '  ' }).success, false)
  })

  it('11. last name required', () => {
    assert.equal(checkoutCustomerSchema.safeParse({ ...VALID, lastName: '' }).success, false)
  })
})

describe('CHECKOUT: Pricing integration + placeholder honesty', () => {
  it('12. Pricing links point to the correct checkout plan', () => {
    const pricing = read('src/components/site/Pricing.tsx')
    assert.ok(pricing.includes('checkoutPlan: "STARTER"'), 'Starter plan tagged')
    assert.ok(pricing.includes('checkoutPlan: "PROFESSIONAL"'), 'Professional plan tagged')
    assert.ok(pricing.includes('/checkout?plan='), 'CTAs navigate to checkout')
    assert.ok(pricing.includes('href: "/contact"'), 'Enterprise keeps contact behavior')
  })

  it('payment section creates nothing and claims nothing', () => {
    const form = read('src/app/checkout/checkout-form.tsx')
    assert.ok(!form.includes('prisma') && !form.includes('fetch('), 'no writes or provider calls')
    assert.ok(form.includes('avant confirmation du paiement'), 'explicit no-premature-success notice')
    assert.ok(!/ussi/.test(form), 'no success wording before provider confirmation')
    const page = read('src/app/checkout/page.tsx')
    assert.ok(!page.includes('clerk') && !page.includes('Clerk'), 'no account creation this phase')
  })

  it('form uses accessible input types and autocomplete', () => {
    const form = read('src/app/checkout/checkout-form.tsx')
    assert.ok(form.includes('type="email"'), 'email type')
    assert.ok(form.includes('type="tel"'), 'tel type')
    assert.ok(form.includes('autoComplete="email"'), 'email autocomplete')
    assert.ok(form.includes('autoComplete="tel"'), 'tel autocomplete')
    assert.ok(form.includes('role="alert"'), 'visible validation errors')
    assert.ok(form.includes('<Label'), 'proper labels')
    assert.ok(form.includes('Controller'), 'react-hook-form controlled fields')
  })
})
