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
 * orderId/externalId are unique per session (externalId uniqueness is
 * provider-enforced: a duplicate replays the existing session with 200).
 * Pure function — no network, no secrets in code.
 */
export function buildChariPaySessionRequest(input: {
  apiKey: string;
  amountMad: number;
  customer: ChariPayCustomer;
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
