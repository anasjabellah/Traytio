'use server';

import { withActionGuard } from '@/lib/action-guard';
import { normalizeActionError } from '@/lib/action-error';
import { BILLING } from '@/lib/notify/messages';
import { validateCheckoutInput } from '@/features/billing/lib/checkout-validation';
import {
  buildChariPaySessionRequest,
  extractSafeSessionResult,
  chariPayErrorCode,
  newChariPayOrderId,
  checkoutReturnUrls,
} from '@/features/billing/lib/charipay';
import { assertBillingEnvSafe } from '@/features/billing/lib/billing-env';
import type { ActionResponse } from '@/features/billing/types';

// ---------------------------------------------------------------------------
// Public SaaS checkout → ChariPay Sandbox payment session.
// New-customer flow: no Clerk session, no membership, no organization —
// identity comes exclusively from the validated checkout form. The plan
// price is resolved server-side from the plan catalog; browser-supplied
// totals are never read. Returns ONLY { checkoutUrl, sessionId }.
// Creates nothing locally: no User, no Organization, no Subscription, no
// email. Payment confirmation belongs to the future webhook phase —
// returning a checkoutUrl is NOT payment success.
// ---------------------------------------------------------------------------

export type ChariPayCheckoutResult = {
  checkoutUrl: string;
  sessionId: string;
};

async function createChariPayCheckoutSessionHandler(
  input: unknown,
): Promise<ActionResponse<ChariPayCheckoutResult>> {
  const GENERIC_ERROR = 'Le paiement est momentanément indisponible. Réessayez.';
  try {
    const validated = validateCheckoutInput(input);
    if (!validated.success) {
      return { success: false, error: validated.error };
    }
    const { planId, priceMad, customer, idempotencyKey } = validated.data;

    const apiKey = process.env.CHARIPAY_API_KEY;
    if (!apiKey) {
      // Diagnostic only: presence fact, never the key itself. A missing key
      // is the expected cause when checkout works locally but fails deployed.
      console.error('[charipay-checkout] CHARIPAY_API_KEY is not configured in this environment');
      return { success: false, error: GENERIC_ERROR };
    }

    // Fail closed on sandbox/production mismatch (e.g. test key deployed to
    // production). Throws inside the guarded handler → normalized generic.
    const billingEnv = assertBillingEnvSafe(apiKey);

    const orderId = newChariPayOrderId();
    const { url, method, headers, body, debug } = buildChariPaySessionRequest({
      apiKey,
      amountMad: priceMad,
      plan: planId,
      customer,
      orderId,
      idempotencyKey,
      urls: checkoutReturnUrls(process.env.NEXT_PUBLIC_APP_URL, planId, orderId),
    });
    console.info(
      `[charipay-checkout] session orderId=${orderId} plan=${planId} amount=${priceMad} env=${billingEnv}`,
    );

    let res: Response;
    try {
      res = await fetch(url, { method, headers, body: JSON.stringify(body) });
    } catch (err: unknown) {
      // Diagnostic only: network-layer failures carry no customer data and
      // no credentials (key travels in headers, never in the URL).
      console.error(
        `[charipay-checkout] network error calling ChariPay: ${err instanceof Error ? err.constructor.name : 'unknown'}`,
      );
      return { success: false, error: GENERIC_ERROR };
    }

    const payload: unknown = await res.json().catch(() => null);
    if (res.status === 409) {
      // Same idempotency key reused with a different payload: the provider
      // kept the original session. Surface a dedicated message so the client
      // retries with a fresh key instead of looping on the generic error.
      console.error(
        `[charipay-checkout] duplicate checkout orderId=${debug.orderId} code=${chariPayErrorCode(payload) ?? 'n/a'}`,
      );
      return { success: false, error: BILLING.CHECKOUT.DUPLICATE };
    }
    if (!res.ok) {
      const code = chariPayErrorCode(payload);
      // Safe log: order/external ids + provider code only — never customer
      // data, never the API key.
      console.error(
        `[charipay-checkout] POST /v1/payment-sessions -> ${res.status} orderId=${debug.orderId} code=${code ?? 'n/a'}`,
      );
      return { success: false, error: GENERIC_ERROR };
    }

    const safe = extractSafeSessionResult(payload);
    if (!safe) {
      console.error(`[charipay-checkout] unusable session payload orderId=${debug.orderId}`);
      return { success: false, error: GENERIC_ERROR };
    }

    console.info(
      `[charipay-checkout] session created orderId=${debug.orderId} sessionId=${safe.sessionId}`,
    );
    return { success: true, data: safe };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, GENERIC_ERROR) };
  }
}

export const createChariPayCheckoutSession = withActionGuard(createChariPayCheckoutSessionHandler, {
  name: 'billing:charipay-checkout',
  public: true,
});
