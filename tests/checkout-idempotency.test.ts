/**
 * P0-2 checkout idempotency + input integrity — execution tests.
 *
 * Executes the real validateCheckoutInput (schema, catalog price, phone
 * normalization, key validation) and the real session builder's key
 * forwarding. The 409 provider-conflict mapping and env wiring are verified
 * as contracts on the action (the handler itself needs Clerk/request scope).
 *
 * Run: npx tsx tests/checkout-idempotency.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validateCheckoutInput } from '../src/features/billing/lib/checkout-validation.js'
import { buildChariPaySessionRequest } from '../src/features/billing/lib/charipay.js'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

const CUSTOMER = { firstName: 'Sara', lastName: 'Bennani', email: 'sara@exemple.com', phone: '+212612345678' }
const KEY = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

function valid(overrides: Record<string, unknown> = {}) {
  return { plan: 'STARTER', customer: { ...CUSTOMER }, ...overrides }
}

describe('CHECKOUT IDEMPOTENCY: input validation (real execution)', () => {
  it('1-2. valid STARTER/PROFESSIONAL resolve server prices', () => {
    const starter = validateCheckoutInput(valid())
    assert.equal(starter.success, true)
    if (!starter.success) return
    assert.equal(starter.data.priceMad, 299)
    const pro = validateCheckoutInput(valid({ plan: 'PROFESSIONAL' }))
    assert.equal(pro.success, true)
    if (!pro.success) return
    assert.equal(pro.data.priceMad, 599)
  })

  it('3-4. client amount/currency/price are stripped, never trusted', () => {
    const res = validateCheckoutInput({
      ...valid(),
      amount: 1,
      currency: 'USD',
      price: 1,
      priceMad: 1,
      organizationId: 'org_evil',
    })
    assert.equal(res.success, true)
    if (!res.success) return
    assert.deepEqual(Object.keys(res.data).sort(), ['customer', 'idempotencyKey', 'planId', 'priceMad'])
    assert.equal(res.data.priceMad, 299, 'catalog price wins over injected amount=1')
  })

  it('5-6. invalid plan and ENTERPRISE rejected', () => {
    assert.equal(validateCheckoutInput(valid({ plan: 'ENTERPRISE' })).success, false)
    assert.equal(validateCheckoutInput(valid({ plan: '' })).success, false)
    assert.equal(validateCheckoutInput(valid({ plan: 299 })).success, false)
  })

  it('7-10. customer field validation', () => {
    assert.equal(validateCheckoutInput(valid({ customer: { ...CUSTOMER, firstName: '' } })).success, false)
    assert.equal(validateCheckoutInput(valid({ customer: { ...CUSTOMER, lastName: '' } })).success, false)
    assert.equal(validateCheckoutInput(valid({ customer: { ...CUSTOMER, email: 'nope' } })).success, false)
    assert.equal(validateCheckoutInput(valid({ customer: { ...CUSTOMER, phone: '' } })).success, false)
    const normalized = validateCheckoutInput(valid({ customer: { ...CUSTOMER, phone: '+212 6 12 34 56 78' } }))
    assert.equal(normalized.success, true)
    if (normalized.success) assert.equal(normalized.data.customer.phone, '+212612345678')
  })

  it('idempotency key validated (format) and passed through untouched', () => {
    const ok = validateCheckoutInput(valid({ idempotencyKey: KEY }))
    assert.equal(ok.success, true)
    if (ok.success) assert.equal(ok.data.idempotencyKey, KEY)
    assert.equal(validateCheckoutInput(valid({ idempotencyKey: 'short' })).success, false)
    assert.equal(validateCheckoutInput(valid({ idempotencyKey: 'has spaces!!' })).success, false)
    const absent = validateCheckoutInput(valid())
    assert.equal(absent.success, true)
    if (absent.success) assert.equal(absent.data.idempotencyKey, undefined)
  })
})

describe('CHECKOUT IDEMPOTENCY: provider key forwarding (real execution)', () => {
  it('11. client key forwarded as Idempotency-Key; fresh key generated otherwise', () => {
    const withKey = buildChariPaySessionRequest({
      apiKey: 'chari_sk_test_x', amountMad: 299, plan: 'STARTER', customer: CUSTOMER, idempotencyKey: KEY,
    })
    assert.equal(withKey.headers['Idempotency-Key'], KEY)
    const without = buildChariPaySessionRequest({
      apiKey: 'chari_sk_test_x', amountMad: 299, plan: 'STARTER', customer: CUSTOMER,
    })
    assert.ok(without.headers['Idempotency-Key'])
    assert.notEqual(without.headers['Idempotency-Key'], KEY)
  })

  it('12-14. request integrity: MAD amount from catalog, customer mapped', () => {
    const req = buildChariPaySessionRequest({
      apiKey: 'chari_sk_test_x', amountMad: 599, plan: 'PROFESSIONAL', customer: CUSTOMER,
    })
    assert.equal(req.body.amount, 599)
    assert.deepEqual(req.body.config.customer, CUSTOMER)
    assert.deepEqual(req.body.metadata.plan, 'PROFESSIONAL')
  })

  it('action maps 409 to the dedicated duplicate message (contract)', () => {
    const src = read('src/features/billing/actions/charipay-checkout.ts')
    assert.ok(src.includes('res.status === 409'), '409 intercepted before generic handling')
    assert.ok(src.includes('BILLING.CHECKOUT.DUPLICATE'), 'dedicated duplicate message')
    assert.ok(src.includes('idempotencyKey,'), 'validated key forwarded to the builder')
  })

  it('form mints one key per mount and sends it (contract)', () => {
    const form = read('src/app/checkout/checkout-form.tsx')
    assert.ok(form.includes('crypto.randomUUID()'), 'key minted client-side per form instance')
    assert.ok(form.includes('idempotencyKey }') || form.includes('idempotencyKey,'), 'key sent with the request')
  })
})
