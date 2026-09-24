/**
 * SaaS provisioning foundation (Phase 1) — contract tests.
 *
 * Covers: valid STARTER/PROFESSIONAL inputs, invalid plan, missing/invalid
 * email, invalid phone, missing provider reference, unsupported provider,
 * server-side price resolution, and client price-override rejection.
 * Pure validation only — no DB, no network, no provisioning writes.
 *
 * Run: npx tsx tests/provisioning-foundation.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  parseProvisioningOrder,
  deriveProvisioningKey,
} from '../src/features/billing/lib/provisioning.js'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')

const CUSTOMER = { firstName: 'Sara', lastName: 'Bennani', email: 'sara@exemple.com', phone: '+212612345678' }
const base = (overrides: Record<string, unknown> = {}) => ({
  provider: 'charipay',
  providerReference: 'evt_test_123',
  plan: 'STARTER',
  customer: { ...CUSTOMER },
  ...overrides,
})

describe('PROVISIONING FOUNDATION: valid inputs', () => {
  it('valid STARTER input normalizes to a trusted order', () => {
    const res = parseProvisioningOrder(base())
    assert.equal(res.success, true)
    if (!res.success) return
    assert.equal(res.order.plan, 'STARTER')
    assert.equal(res.order.priceMad, 299)
    assert.equal(res.order.currency, 'MAD')
    assert.equal(res.order.provider, 'charipay')
    assert.equal(res.order.providerReference, 'evt_test_123')
    assert.equal(res.order.customer.email, 'sara@exemple.com')
    assert.ok(/^[0-9a-f]{64}$/.test(res.order.idempotencyKey), 'sha256 idempotency key')
  })

  it('valid PROFESSIONAL input resolves 599 MAD', () => {
    const res = parseProvisioningOrder(base({ plan: 'PROFESSIONAL' }))
    assert.equal(res.success, true)
    if (!res.success) return
    assert.equal(res.order.plan, 'PROFESSIONAL')
    assert.equal(res.order.priceMad, 599)
  })

  it('idempotency key is stable per provider reference', () => {
    assert.equal(deriveProvisioningKey('charipay', 'evt_1'), deriveProvisioningKey('charipay', 'evt_1'))
    assert.notEqual(deriveProvisioningKey('charipay', 'evt_1'), deriveProvisioningKey('charipay', 'evt_2'))
    assert.notEqual(deriveProvisioningKey('charipay', 'evt_1'), deriveProvisioningKey('other', 'evt_1'))
  })
})

describe('PROVISIONING FOUNDATION: rejections', () => {
  it('invalid plan rejected', () => {
    assert.equal(parseProvisioningOrder(base({ plan: 'ENTERPRISE' })).success, false)
    assert.equal(parseProvisioningOrder(base({ plan: '' })).success, false)
  })

  it('missing/invalid email rejected', () => {
    assert.equal(parseProvisioningOrder(base({ customer: { ...CUSTOMER, email: '' } })).success, false)
    assert.equal(parseProvisioningOrder(base({ customer: { ...CUSTOMER, email: 'nope' } })).success, false)
  })

  it('invalid phone rejected', () => {
    assert.equal(parseProvisioningOrder(base({ customer: { ...CUSTOMER, phone: '' } })).success, false)
    assert.equal(parseProvisioningOrder(base({ customer: { ...CUSTOMER, phone: '12' } })).success, false)
  })

  it('missing provider reference rejected', () => {
    assert.equal(parseProvisioningOrder(base({ providerReference: '' })).success, false)
    const { providerReference: _drop, ...rest } = base() as Record<string, unknown>
    void _drop
    assert.equal(parseProvisioningOrder(rest).success, false)
  })

  it('unsupported provider rejected (mock/lemonsqueezy never provision)', () => {
    assert.equal(parseProvisioningOrder(base({ provider: 'mock' })).success, false)
    assert.equal(parseProvisioningOrder(base({ provider: 'lemonsqueezy' })).success, false)
    assert.equal(parseProvisioningOrder(base({ provider: '' })).success, false)
  })
})

describe('PROVISIONING FOUNDATION: server-authoritative pricing', () => {
  it('client cannot override the catalog price', () => {
    const res = parseProvisioningOrder({ ...base(), priceMad: 1, amount: 1, price: 1, currency: 'USD' })
    assert.equal(res.success, false, 'strict schema rejects smuggled pricing fields')
    const ok = parseProvisioningOrder(base())
    assert.equal(ok.success, true)
    if (ok.success) assert.equal(ok.order.priceMad, 299)
  })

  it('organizationId and status are never accepted', () => {
    assert.equal(parseProvisioningOrder({ ...base(), organizationId: 'org_x' }).success, false)
    assert.equal(parseProvisioningOrder({ ...base(), status: 'ACTIVE' }).success, false)
  })
})

describe('PROVISIONING FOUNDATION: Phase 1 scope', () => {
  it('Phase 1 parser performs no database writes', () => {
    const src = read('src/features/billing/lib/provisioning.ts')
    const phase1 = src
      .slice(0, src.indexOf('Phase 2 —'))
      .split('\n')
      .filter((l) => !l.startsWith('import '))
      .join('\n')
    assert.ok(!phase1.includes('prisma'), 'Phase 1 has no database access')
    assert.ok(!phase1.includes('user.create') && !phase1.includes('organization.create'), 'Phase 1 has no provisioning writes')
    assert.ok(!phase1.includes('clerk') && !phase1.includes('Clerk'), 'Phase 1 has no account creation')
    assert.ok(!phase1.includes('sendEmail') && !phase1.includes('resend'), 'Phase 1 sends no emails')
  })

  it('reuses the existing plan catalog and customer schema', () => {
    const src = read('src/features/billing/lib/provisioning.ts')
    assert.ok(src.includes('resolvePlan'), 'plan resolved via catalog')
    assert.ok(src.includes('checkoutCustomerSchema'), 'customer validated via shared schema')
  })
})
