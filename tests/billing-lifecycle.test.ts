/**
 * P0-2 subscription lifecycle — execution tests (no DB, no network).
 *
 * Executes the real transition table, recency guard, event-time extraction
 * and period extension from subscription-lifecycle.ts. The table is the
 * contract the webhook core enforces; every cell below is asserted.
 *
 * Run: npx tsx tests/billing-lifecycle.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  nextSubscriptionState,
  extractChariPayEventTime,
  isEventStale,
  extendBillingPeriod,
  LIFECYCLE_SKEW_TOLERANCE_MS,
} from '../src/features/billing/lib/subscription-lifecycle.js'

describe('LIFECYCLE: transition table (real execution)', () => {
  it('payment.succeeded always activates (activation, recovery, renewal, re-subscribe)', () => {
    for (const current of [null, undefined, 'INCOMPLETE', 'ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE_EXPIRED']) {
      assert.equal(nextSubscriptionState(current as never, 'payment.succeeded'), 'ACTIVE', `from ${String(current)}`)
    }
  })

  it('payment.failed marks PAST_DUE only from ACTIVE/TRIALING', () => {
    assert.equal(nextSubscriptionState('ACTIVE', 'payment.failed'), 'PAST_DUE')
    assert.equal(nextSubscriptionState('TRIALING', 'payment.failed'), 'PAST_DUE')
    for (const current of [null, undefined, 'INCOMPLETE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE_EXPIRED']) {
      assert.equal(nextSubscriptionState(current as never, 'payment.failed'), null, `no change from ${String(current)}`)
    }
  })

  it('subscription.canceled is terminal-forward (never resurrects silently)', () => {
    for (const current of [null, undefined, 'ACTIVE', 'TRIALING', 'PAST_DUE', 'INCOMPLETE', 'UNPAID', 'INCOMPLETE_EXPIRED']) {
      assert.equal(nextSubscriptionState(current as never, 'subscription.canceled'), 'CANCELED', `from ${String(current)}`)
    }
    assert.equal(nextSubscriptionState('CANCELED', 'subscription.canceled'), null, 'already terminal')
  })
})

describe('LIFECYCLE: recency guard (real execution)', () => {
  const T0 = new Date('2026-09-01T12:00:00.000Z')

  it('nulls on either side mean "no ordering info" → apply', () => {
    assert.equal(isEventStale(null, T0), false)
    assert.equal(isEventStale(T0, null), false)
    assert.equal(isEventStale(null, null), false)
  })

  it('provably older event is stale, newer or concurrent is not', () => {
    const older = new Date(T0.getTime() - LIFECYCLE_SKEW_TOLERANCE_MS - 1000)
    assert.equal(isEventStale(older, T0), true)
    assert.equal(isEventStale(new Date(T0.getTime() - 1000), T0), false, 'inside skew tolerance')
    assert.equal(isEventStale(T0, T0), false)
    assert.equal(isEventStale(new Date(T0.getTime() + 1000), T0), false)
  })

  it('event timestamps extract from real payload shapes', () => {
    assert.deepEqual(
      extractChariPayEventTime({ CreatedAt: '2026-09-01T12:00:00.000Z' }),
      new Date('2026-09-01T12:00:00.000Z'),
    )
    assert.deepEqual(extractChariPayEventTime({ createdAt: 1756728000000 }), new Date(1756728000000))
    assert.equal(extractChariPayEventTime({}), null)
    assert.equal(extractChariPayEventTime({ CreatedAt: 'garbage' }), null)
    assert.equal(extractChariPayEventTime(null), null)
  })
})

describe('LIFECYCLE: period extension (real execution)', () => {
  it('extends from the stored end when in the future (early renewals stack)', () => {
    const now = new Date('2026-09-10T00:00:00.000Z')
    const end = new Date('2026-09-20T00:00:00.000Z')
    const { periodStart, periodEnd } = extendBillingPeriod(end, now)
    assert.deepEqual(periodStart, now)
    assert.equal(periodEnd.getFullYear(), 2026)
    assert.equal(periodEnd.getMonth(), 9, 'one month past the stored end (October)')
    assert.equal(periodEnd.getDate(), 20)
  })

  it('expired or missing end restarts from now', () => {
    const now = new Date('2026-09-10T00:00:00.000Z')
    const past = new Date('2026-08-01T00:00:00.000Z')
    assert.deepEqual(extendBillingPeriod(past, now).periodEnd, new Date('2026-10-10T00:00:00.000Z'))
    assert.deepEqual(extendBillingPeriod(null, now).periodEnd, new Date('2026-10-10T00:00:00.000Z'))
  })
})
