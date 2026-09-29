/**
 * P0-2 billing environment separation — execution tests (no network).
 *
 * Executes the real resolveBillingEnv/assertBillingEnvSafe: sandbox and
 * production can never share credentials in either direction, and unknown
 * key shapes fail closed. process.env is manipulated per-test with
 * guaranteed restoration.
 *
 * Run: npx tsx tests/billing-env.test.ts
 */

import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveBillingEnv,
  assertBillingEnvSafe,
  BillingConfigError,
  isTestKey,
  isLiveKey,
} from '../src/features/billing/lib/billing-env.js'

const SAVED_BILLING_ENV = process.env.BILLING_ENV
const SAVED_NODE_ENV = process.env.NODE_ENV

function setEnv(name: string, value: string | undefined): void {
  const record = process.env as Record<string, string | undefined>
  if (value === undefined) delete record[name]
  else record[name] = value
}

afterEach(() => {
  setEnv('BILLING_ENV', SAVED_BILLING_ENV)
  setEnv('NODE_ENV', SAVED_NODE_ENV)
})

const TEST_KEY = 'chari_sk_test_abc123'
const LIVE_KEY = 'chari_sk_live_abc123'

describe('BILLING ENV: resolution (real execution)', () => {
  it('explicit BILLING_ENV wins over NODE_ENV', () => {
    setEnv('BILLING_ENV', 'production')
    setEnv('NODE_ENV', 'development')
    assert.equal(resolveBillingEnv(), 'production')
    setEnv('BILLING_ENV', 'sandbox')
    setEnv('NODE_ENV', 'production')
    assert.equal(resolveBillingEnv(), 'sandbox')
  })

  it('unset BILLING_ENV derives from NODE_ENV (production only in prod)', () => {
    setEnv('BILLING_ENV', undefined)
    setEnv('NODE_ENV', 'production')
    assert.equal(resolveBillingEnv(), 'production')
    setEnv('NODE_ENV', 'development')
    assert.equal(resolveBillingEnv(), 'sandbox')
    setEnv('NODE_ENV', 'test')
    assert.equal(resolveBillingEnv(), 'sandbox')
  })

  it('key classifiers recognize documented prefixes only', () => {
    assert.equal(isTestKey(TEST_KEY), true)
    assert.equal(isLiveKey(LIVE_KEY), true)
    assert.equal(isTestKey(LIVE_KEY), false)
    assert.equal(isLiveKey(TEST_KEY), false)
    assert.equal(isTestKey('Bearer xyz'), false)
    assert.equal(isLiveKey('Bearer xyz'), false)
  })
})

describe('BILLING ENV: fail-closed matrix (real execution)', () => {
  it('20. production requires a live key (test key refused)', () => {
    assert.throws(
      () => assertBillingEnvSafe(TEST_KEY, { BILLING_ENV: 'production', NODE_ENV: 'production' }),
      (err: unknown) => err instanceof BillingConfigError,
    )
    assert.equal(assertBillingEnvSafe(LIVE_KEY, { BILLING_ENV: 'production', NODE_ENV: 'production' }), 'production')
  })

  it('sandbox requires a test key (live key refused — never charge from dev)', () => {
    assert.throws(
      () => assertBillingEnvSafe(LIVE_KEY, { BILLING_ENV: 'sandbox', NODE_ENV: 'development' }),
      BillingConfigError,
    )
    assert.equal(assertBillingEnvSafe(TEST_KEY, { BILLING_ENV: 'sandbox', NODE_ENV: 'development' }), 'sandbox')
  })

  it('unknown key shapes are rejected in both environments', () => {
    assert.throws(() => assertBillingEnvSafe('Bearer xyz', { BILLING_ENV: 'sandbox' }), BillingConfigError)
    assert.throws(() => assertBillingEnvSafe('Bearer xyz', { BILLING_ENV: 'production' }), BillingConfigError)
    assert.throws(() => assertBillingEnvSafe('', { BILLING_ENV: 'sandbox' }), BillingConfigError)
  })
})
