import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// ChariPay provider layer — Sandbox payment sessions for the public SaaS
// checkout. Official contract: https://charipay.ma/fr/api-docs (OpenAPI
// v1.0.0).
//   - Base URL shared sandbox/production: https://api-psp.charipay.ma
//   - Auth header: X-CHARI-PAY-API-KEY (key selects the environment)
//   - Amounts in MAD major units (299 = 299 MAD)
//   - POST /v1/payment-sessions → hosted checkoutUrl (single-use session)
//   - Idempotency-Key + X-Request-Id headers; externalId dedups per merchant
//   - Errors: { error: { code, message }, correlationId } — test `code`
// No SDK: a single fetch call site does not justify a dependency.
// The API key always arrives as a parameter from server-side env — this
// module never reads env itself and must never be imported by client code.
// ---------------------------------------------------------------------------

export const CHARIPAY_API_BASE = 'https://api-psp.charipay.ma';

export type ChariPayCustomer = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
};

export type ChariPaySessionRequest = {
  url: string;
  method: 'POST';
  headers: Record<string, string>;
  body: {
    amount: number;
    orderId: string;
    singleUse: boolean;
    externalId: string;
    config: {
      customer: ChariPayCustomer;
    };
    /** Echoed back verbatim in the payment webhook (OpenAPI: ≤ 4 KB). */
    metadata: Record<string, string>;
    /** Also deliver payment.failed webhooks (default false). */
    notifyOnFailure: boolean;
  };
  /** Values safe to log (never includes the API key). */
  debug: { orderId: string; externalId: string; idempotencyKey: string; requestId: string };
};

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

/**
 * Build POST /v1/payment-sessions for a SaaS plan checkout.
 * Amount comes from the caller (which must be the server-side plan
 * catalog — never browser input). config.urls is deliberately OMITTED:
 * ChariPay rejects non-HTTPS/localhost return URLs with HTTP 400, so the
 * provider falls back to merchant/account defaults.
 * `metadata` carries ONLY Traytio reconciliation data (plan + customer
 * identity) and is echoed back in the payment webhook — it is the SOLE
 * bridge between the stateless checkout and later provisioning.
 * orderId/externalId are unique per session (externalId uniqueness is
 * provider-enforced: a duplicate replays the existing session with 200).
 * Pure function — no network, no secrets in code.
 */
export function buildChariPaySessionRequest(input: {
  apiKey: string;
  amountMad: number;
  customer: ChariPayCustomer;
  plan: string;
  orderId?: string;
  externalId?: string;
  idempotencyKey?: string;
  requestId?: string;
}): ChariPaySessionRequest {
  const orderId = input.orderId ?? newId('TUR-SUB');
  let externalId = input.externalId ?? newId('tur-sub');
  if (externalId === orderId) externalId = newId('tur-sub');
  const idempotencyKey = input.idempotencyKey ?? crypto.randomUUID();
  const requestId = input.requestId ?? crypto.randomUUID();

  return {
    url: `${CHARIPAY_API_BASE}/v1/payment-sessions`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CHARI-PAY-API-KEY': input.apiKey,
      'Idempotency-Key': idempotencyKey,
      'X-Request-Id': requestId,
    },
    body: {
      amount: input.amountMad,
      orderId,
      singleUse: true,
      externalId,
      config: {
        customer: {
          email: input.customer.email,
          firstName: input.customer.firstName,
          lastName: input.customer.lastName,
          phone: input.customer.phone,
        },
      },
      metadata: {
        plan: input.plan,
        email: input.customer.email,
        firstName: input.customer.firstName,
        lastName: input.customer.lastName,
        phone: input.customer.phone,
      },
      notifyOnFailure: true,
    },
    debug: { orderId, externalId, idempotencyKey, requestId },
  };
}

export type ChariPaySafeSessionResult = {
  sessionId: string;
  checkoutUrl: string;
};

/**
 * Extract ONLY the safe fields from a session-create response.
 * Returns null when the payload does not carry a usable session.
 * Creating a session is NOT payment success — the customer still has to
 * pay on the hosted page and confirmation arrives via webhook later.
 */
export function extractSafeSessionResult(payload: unknown): ChariPaySafeSessionResult | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const record = payload as Record<string, unknown>;
  const sessionId =
    typeof record.sessionId === 'string' && record.sessionId ? record.sessionId : null;
  const checkoutUrl = [
    record.checkoutUrl,
    record.checkout_url,
    record.paymentUrl,
    record.payment_url,
    record.url,
  ].find((v): v is string => typeof v === 'string' && v.length > 0) ?? null;
  if (!sessionId || !checkoutUrl) return null;
  return { sessionId, checkoutUrl };
}

/** Stable provider error code from a response payload (never the message). */
export function chariPayErrorCode(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const error = (payload as { error?: unknown }).error;
  if (typeof error !== 'object' || error === null) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && code ? code : null;
}

/**
 * Normalize a phone number to E.164 (required by ChariPay: e.g.
 * +212600000000 — spaces and separators are rejected provider-side with
 * MISSING_PARAMETER). Only strips visual separators; never guesses a
 * country prefix. Returns null when the result is not valid E.164.
 */
export function normalizePhoneE164(phone: string): string | null {
  const compact = phone.replace(/[\s\-.\(\)]/g, '');
  return /^\+\d{7,15}$/.test(compact) ? compact : null;
}

export type ChariPayPaymentDetails = {
  /** Our order identifier (Reference field). */
  reference: string;
  /** Amount in MAD major units, when numeric. */
  amount: number | null;
  /** Echoed session metadata (plan + customer), object form or null. */
  metadata: Record<string, unknown> | null;
};

function readString(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return null;
}

/**
 * Extract payment correlation data from a payment.* webhook payload.
 * Real payloads use PascalCase (Reference, Amount, Metadata, …); camelCase
 * spellings are accepted defensively. Metadata may arrive as an object or
 * a JSON string (parsed when possible, null otherwise — never trusted
 * blindly). Returns null when the payload carries no usable reference.
 */
export function extractChariPayPaymentDetails(payload: unknown): ChariPayPaymentDetails | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const record = payload as Record<string, unknown>;
  const reference = readString(record, 'Reference', 'reference', 'GatewayReferenceId');
  if (!reference) return null;
  const amountRaw = record.Amount ?? record.amount;
  const amount = typeof amountRaw === 'number' && Number.isFinite(amountRaw) ? amountRaw : null;
  const metaRaw = record.Metadata ?? record.metadata ?? record.meta ?? null;
  let metadata: Record<string, unknown> | null = null;
  if (typeof metaRaw === 'object' && metaRaw !== null && !Array.isArray(metaRaw)) {
    metadata = metaRaw as Record<string, unknown>;
  } else if (typeof metaRaw === 'string' && metaRaw.length > 0) {
    try {
      const parsed: unknown = JSON.parse(metaRaw);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        metadata = parsed as Record<string, unknown>;
      }
    } catch {
      metadata = null;
    }
  }
  return { reference, amount, metadata };
}

// ---------------------------------------------------------------------------
// ChariPay webhook verification — official signed-delivery contract:
//   - Headers: X-CHARI-SIGNATURE (lowercase hex), X-CHARI-TIMESTAMP
//     (milliseconds since epoch), Chari-Event-Id (dedup key — NOT
//     Chari-Webhook-Id, which changes on every redelivery).
//   - Signed input: `${timestamp}.${rawBody}` (RAW bytes, before parsing).
//   - Algorithm: HMAC-SHA256 with the endpoint secret.
//   - Freshness: reject timestamps beyond ±5 minutes (anti-replay).
//   - Compare in constant time; malformed signatures answer false, never throw
//     (a throw would become a 500 → pointless provider retries).
// Docs: https://charipay.ma/fr/api-docs (Webhooks guide).
// ---------------------------------------------------------------------------

export const CHARIPAY_PROVIDER = 'charipay';
export const CHARI_WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Verify a ChariPay webhook delivery. Pure function — safe to unit test with
 * HMAC fixtures computed locally. Returns false for every failure mode
 * (missing/malformed/stale/signature mismatch); never throws.
 */
export function verifyChariPaySignature(input: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  secret: string | null | undefined;
  nowMs?: number;
}): boolean {
  const { rawBody, signature, timestamp, secret } = input;
  if (!signature || !timestamp || !secret) return false;
  if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const now = input.nowMs ?? Date.now();
  if (Math.abs(now - ts) > CHARI_WEBHOOK_TIMESTAMP_TOLERANCE_MS) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}

export type ChariPayWebhookEnvelope = {
  /** Dotted event type exactly as delivered (e.g. payment.succeeded). */
  eventType: string;
  /** Authoritative dedup key: the Chari-Event-Id delivery header. */
  providerEventId: string;
};

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Resolve the envelope from delivery headers with body fallback.
 * The event TYPE is persisted exactly as received (never allowlisted here —
 * unknown types are stored safely and left for later phases). The event ID
 * MUST come from Chari-Event-Id (stable across redeliveries); orderId and
 * Chari-Webhook-Id are explicitly NOT dedup keys.
 */
export function parseChariPayEnvelope(input: {
  headerEventId: string | null;
  headerEventType: string | null;
  body: unknown;
}): ChariPayWebhookEnvelope | null {
  const bodyRecord =
    typeof input.body === 'object' && input.body !== null
      ? (input.body as Record<string, unknown>)
      : null;
  const providerEventId =
    nonEmptyString(input.headerEventId) ??
    nonEmptyString(bodyRecord?.eventId) ??
    nonEmptyString(bodyRecord?.event_id) ??
    nonEmptyString(bodyRecord?.WebhookEventId) ??
    nonEmptyString(bodyRecord?.webhookEventId) ??
    nonEmptyString(bodyRecord?.id);
  const eventType =
    nonEmptyString(input.headerEventType) ??
    nonEmptyString(bodyRecord?.eventType) ??
    nonEmptyString(bodyRecord?.event_type) ??
    nonEmptyString(bodyRecord?.type);
  if (!providerEventId || !eventType) return null;
  return { eventType, providerEventId };
}
