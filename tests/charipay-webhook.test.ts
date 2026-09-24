/**
 * ChariPay webhook phase — focused tests (no network, no DB, no secrets).
 *
 * Covers: signature accept/reject matrix (valid, invalid, missing,
 * malformed, stale timestamp, raw-body binding), envelope resolution
 * (header-first, body fallback, orderId never an event id), and route
 * source contracts (raw-first verify, timing-safe compare, DB-backed
 * dedup + P2002 race, atomic persist, non-2xx on DB failure, no business
 * actions, public route, server-only secret, no sensitive logging).
 *
 * Run: npx tsx tests/charipay-webhook.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  CHARI_WEBHOOK_TIMESTAMP_TOLERANCE_MS,
  verifyChariPaySignature,
  parseChariPayEnvelope,
} from '../src/features/billing/lib/charipay.js'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8')
const SECRET = 'whsec_test_secret'
const NOW = 1_800_000_000_000

function sign(rawBody: string, timestamp: string): string {
  return createHmac('sha256', SECRET).update(`${timestamp}.${rawBody}`).digest('hex')
}

const BODY = JSON.stringify({ eventType: 'payment.succeeded', data: { id: 'pay_1' } })
const TS = String(NOW)
const GOOD = sign(BODY, TS)

describe('CHARIPAY WEBHOOK: signature verification', () => {
  it('1. valid signature accepted', () => {
    assert.equal(
      verifyChariPaySignature({ rawBody: BODY, signature: GOOD, timestamp: TS, secret: SECRET, nowMs: NOW }),
      true,
    )
  })

  it('2. invalid signature rejected', () => {
    const bad = GOOD.slice(0, -1) + (GOOD.endsWith('0') ? '1' : '0')
    assert.equal(
      verifyChariPaySignature({ rawBody: BODY, signature: bad, timestamp: TS, secret: SECRET, nowMs: NOW }),
      false,
    )
  })

  it('3. missing signature / timestamp / secret rejected', () => {
    assert.equal(verifyChariPaySignature({ rawBody: BODY, signature: null, timestamp: TS, secret: SECRET, nowMs: NOW }), false)
    assert.equal(verifyChariPaySignature({ rawBody: BODY, signature: GOOD, timestamp: null, secret: SECRET, nowMs: NOW }), false)
    assert.equal(verifyChariPaySignature({ rawBody: BODY, signature: GOOD, timestamp: TS, secret: null, nowMs: NOW }), false)
    assert.equal(verifyChariPaySignature({ rawBody: BODY, signature: GOOD, timestamp: TS, secret: '', nowMs: NOW }), false)
  })

  it('4-5. stale timestamp rejected, fresh boundary accepted', () => {
    const stale = String(NOW - CHARI_WEBHOOK_TIMESTAMP_TOLERANCE_MS - 1000)
    assert.equal(
      verifyChariPaySignature({ rawBody: BODY, signature: sign(BODY, stale), timestamp: stale, secret: SECRET, nowMs: NOW }),
      false,
    )
    const future = String(NOW + CHARI_WEBHOOK_TIMESTAMP_TOLERANCE_MS - 1000)
    assert.equal(
      verifyChariPaySignature({ rawBody: BODY, signature: sign(BODY, future), timestamp: future, secret: SECRET, nowMs: NOW }),
      true,
    )
    assert.equal(
      verifyChariPaySignature({ rawBody: BODY, signature: GOOD, timestamp: 'not-a-number', secret: SECRET, nowMs: NOW }),
      false,
    )
  })

  it('6. malformed signatures rejected without throwing', () => {
    for (const bad of ['', 'xyz', '0'.repeat(63), '0'.repeat(65), 'zz' + GOOD.slice(2)]) {
      assert.equal(
        verifyChariPaySignature({ rawBody: BODY, signature: bad, timestamp: TS, secret: SECRET, nowMs: NOW }),
        false,
      )
    }
  })

  it('7. verification binds the exact raw body (reserialization breaks it)', () => {
    const reserialized = JSON.stringify(JSON.parse(BODY))
    assert.equal(
      verifyChariPaySignature({ rawBody: reserialized + ' ', signature: GOOD, timestamp: TS, secret: SECRET, nowMs: NOW }),
      false,
    )
    assert.equal(
      verifyChariPaySignature({ rawBody: BODY, signature: sign('tampered', TS), timestamp: TS, secret: SECRET, nowMs: NOW }),
      false,
    )
  })
})

describe('CHARIPAY WEBHOOK: envelope resolution', () => {
  it('header event id + type win', () => {
    assert.deepEqual(
      parseChariPayEnvelope({ headerEventId: 'evt_1', headerEventType: 'payment.succeeded', body: {} }),
      { eventType: 'payment.succeeded', providerEventId: 'evt_1' },
    )
  })

  it('8-9. payment success and failure envelopes resolve', () => {
    for (const t of ['payment.succeeded', 'payment.failed']) {
      const out = parseChariPayEnvelope({ headerEventId: 'evt_9', headerEventType: t, body: null })
      assert.deepEqual(out, { eventType: t, providerEventId: 'evt_9' })
    }
  })

  it('10. unknown valid types pass through untouched', () => {
    assert.deepEqual(
      parseChariPayEnvelope({ headerEventId: 'evt_x', headerEventType: 'subscription.payment_succeeded', body: {} }),
      { eventType: 'subscription.payment_succeeded', providerEventId: 'evt_x' },
    )
  })

  it('13. unknown event id with valid envelope is a new event (never orderId-derived)', () => {
    const out = parseChariPayEnvelope({
      headerEventId: null,
      headerEventType: null,
      body: { eventId: 'evt_new', eventType: 'payment.succeeded', orderId: 'TUR-SUB-1' },
    })
    assert.deepEqual(out, { eventType: 'payment.succeeded', providerEventId: 'evt_new' })
    assert.equal(
      parseChariPayEnvelope({ headerEventId: null, headerEventType: null, body: { orderId: 'TUR-SUB-1' } }),
      null,
      'orderId alone is not an envelope',
    )
    assert.equal(parseChariPayEnvelope({ headerEventId: null, headerEventType: null, body: null }), null)
  })
})

describe('CHARIPAY WEBHOOK: route source contracts', () => {
  const route = read('src/app/api/webhooks/charipay/route.ts')

  it('route is public, secret is server-only', () => {
    assert.ok(!route.includes('auth(') && !route.includes('getCurrentMembership'), 'no session auth on webhooks')
    assert.ok(route.includes('process.env.CHARIPAY_WEBHOOK_SECRET'), 'secret from server env only')
    assert.ok(!route.includes('NEXT_PUBLIC'), 'no public secret exposure')
  })

  it('raw body verified before parsing, constant-time compare', () => {
    const rawIdx = route.indexOf('await req.text()')
    const verifyIdx = route.indexOf('verifyChariPaySignature({')
    const parseIdx = route.indexOf('JSON.parse(rawBody)')
    assert.ok(rawIdx > 0 && verifyIdx > rawIdx && parseIdx > verifyIdx, 'raw → verify → parse order')
    const lib = read('src/features/billing/lib/charipay.ts')
    assert.ok(lib.includes('timingSafeEqual'), 'constant-time comparison')
    assert.ok(lib.includes('timestamp}.${rawBody}') || lib.includes('timestamp +'), 'timestamp-bound HMAC input')
  })

  it('11-12. dedup is database-backed with P2002 race safety', () => {
    assert.ok(route.includes('provider_providerEventId'), 'unique-key lookup')
    assert.ok(route.includes('P2002'), 'concurrent insert race handled')
    assert.ok(route.includes('duplicate: duplicate'), 'duplicates answer 2xx without rewrite')
  })

  it('13-14. DB failure is non-2xx; processed marked only after full success', () => {
    assert.ok(route.includes("status: 500"), 'persistence failure returns 500 for retry')
    assert.ok(route.includes('processedAt: null'), 'writes are conditional on unprocessed state')
    assert.ok(route.includes('processSucceededPayment'), 'success path funnels through one function')
  })

  it('15-18. business actions only via existing services on payment.succeeded', () => {
    for (const token of ['prisma.user.create', 'prisma.organization.create', 'subscription.upsert', 'sendEmail', 'invitation', 'clerkClient']) {
      assert.ok(!route.includes(token), `route must not contain ${token}`)
    }
    assert.ok(route.includes('provisionSaaSCustomer('), 'provisioning delegated to the existing service')
    assert.ok(route.includes('sendSaaSActivationEmail('), 'email delegated to the existing sender')
    assert.ok(route.includes("eventType !== 'payment.succeeded'"), 'only succeeded provisions')
  })

  it('19. secrets and payloads never logged', () => {
    assert.ok(!route.includes('console.log(rawBody') && !route.includes('JSON.stringify(body'), 'no body logging')
    assert.ok(!route.includes('${secret'), 'secret never interpolated into logs')
    assert.ok(route.includes('console.info'), 'identifier-only delivery log exists')
  })

  it('20. org id never trusted from client input', () => {
    assert.ok(route.includes('organizationId: null'), 'org never invented')
    assert.ok(!route.includes('body.organizationId') && !route.includes('organization_id'), 'no org read from payload')
  })

  it('schema carries the dedup constraint', () => {
    const schema = read('src/prisma/schema.prisma')
    assert.ok(schema.includes('@@unique([provider, providerEventId])'), 'BillingWebhookEvent unique key present')
  })
})
