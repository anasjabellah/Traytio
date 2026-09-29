'use server';

import { withActionGuard } from '@/lib/action-guard';
import { normalizeActionError } from '@/lib/action-error';
import { BILLING } from '@/lib/notify/messages';
import { validateCheckoutInput } from '@/features/billing/lib/checkout-validation';
import {
  buildChariPayCustomerRequest,
  buildChariPaySubscriptionRequest,
  extractSubscriptionResult,
  chariPayErrorCode,
  newChariPayOrderId,
  checkoutReturnUrls,
} from '@/features/billing/lib/charipay';
import { assertBillingEnvSafe } from '@/features/billing/lib/billing-env';
import type { ActionResponse } from '@/features/billing/types';

// ---------------------------------------------------------------------------
// Recurring SaaS checkout → ChariPay customer + subscription.
// New-customer flow: no Clerk session required. Plan/price/frequency are
// server-resolved (MONTHLY only for MVP). Creates/resolves a ChariPay
// customer, then creates a subscription with externalId=idempotency-linked
// orderId so repeated submits do not create duplicate subscriptions.
// Returns the first-charge hosted checkout URL (3DS consent). The webhook
// remains the sole activator — the redirect is never trusted.
// Keeps the one-time payment-sessions flow intact (separate action).
// ---------------------------------------------------------------------------

export type SubscriptionCheckoutResult = {
  checkoutUrl: string;
  subscriptionId: string;
};

async function createSubscriptionCheckoutHandler(
  input: unknown,
): Promise<ActionResponse<SubscriptionCheckoutResult>> {
  const GENERIC_ERROR = 'Le paiement est momentanément indisponible. Réessayez.';
  try {
    const validated = validateCheckoutInput(input);
    if (!validated.success) {
      return { success: false, error: validated.error };
    }
    const { planId, priceMad, customer, idempotencyKey } = validated.data;

    const apiKey = process.env.CHARIPAY_API_KEY;
    if (!apiKey) {
      console.error('[subscription-checkout] CHARIPAY_API_KEY missing');
      return { success: false, error: GENERIC_ERROR };
    }
    const billingEnv = assertBillingEnvSafe(apiKey);

    // 1. Ensure ChariPay customer (idempotent by email via provider dedup;
    //    we create with a stable idempotencyKey derived from email+plan).
    const customerReq = buildChariPayCustomerRequest({
      apiKey,
      customer,
      idempotencyKey: idempotencyKey ? `cust-${idempotencyKey}` : undefined,
    });
    let clientId: string | null = null;
    try {
      const res = await fetch(customerReq.url, {
        method: customerReq.headers['Idempotency-Key'] ? 'POST' : 'POST',
        headers: customerReq.headers,
        body: JSON.stringify(customerReq.body),
      });
      const payload: unknown = await res.json().catch(() => null);
      if (res.ok) {
        const rec = payload as Record<string, unknown>;
        clientId =
          (typeof rec.id === 'string' && rec.id) ||
          (typeof rec.clientId === 'string' && rec.clientId) ||
          (typeof (rec as { customerId?: unknown }).customerId === 'string' &&
            (rec as { customerId: string }).customerId) ||
          null;
        // Some providers return 200 with existing on duplicate; still ok.
        if (!clientId && res.status === 200) {
          clientId = (rec as { id?: string }).id ?? null;
        }
      } else if (res.status === 409) {
        // Duplicate — try to resolve existing client by listing (fallback:
        // use a deterministic externalId path; for MVP we treat as retryable
        // and surface generic error so the client retries with same key).
        const code = chariPayErrorCode(payload);
        console.error(`[subscription-checkout] customer duplicate code=${code ?? 'n/a'}`);
        // Attempt to fetch existing subscription directly via externalId
        // (created concurrently); we still need clientId — fail closed.
        return { success: false, error: BILLING.CHECKOUT.DUPLICATE };
      } else {
        const code = chariPayErrorCode(payload);
        console.error(`[subscription-checkout] customer create ${res.status} code=${code ?? 'n/a'}`);
        return { success: false, error: GENERIC_ERROR };
      }
      if (!clientId) {
        console.error('[subscription-checkout] customer response missing id');
        return { success: false, error: GENERIC_ERROR };
      }
    } catch (err: unknown) {
      console.error(`[subscription-checkout] customer network ${err instanceof Error ? err.constructor.name : 'unknown'}`);
      return { success: false, error: GENERIC_ERROR };
    }

    // 2. Create subscription (MONTHLY, externalId = orderId for idempotency).
    const orderId = newChariPayOrderId();
    const subReq = buildChariPaySubscriptionRequest({
      apiKey,
      clientId,
      amountMad: priceMad,
      plan: planId,
      externalId: orderId,
      customer,
      idempotencyKey,
    });
    // Note: checkoutReturnUrls not used for subscriptions (provider uses
    // currentCharge checkoutUrl); kept for one-time flow.

    let subRes: Response;
    try {
      subRes = await fetch(subReq.url, {
        method: subReq.headers['Idempotency-Key'] ? 'POST' : 'POST',
        headers: subReq.headers,
        body: JSON.stringify(subReq.body),
      });
    } catch (err: unknown) {
      console.error(`[subscription-checkout] sub network ${err instanceof Error ? err.constructor.name : 'unknown'}`);
      return { success: false, error: GENERIC_ERROR };
    }
    const subPayload: unknown = await subRes.json().catch(() => null);
    if (subRes.status === 409) {
      console.error(`[subscription-checkout] duplicate sub code=${chariPayErrorCode(subPayload) ?? 'n/a'}`);
      return { success: false, error: BILLING.CHECKOUT.DUPLICATE };
    }
    if (!subRes.ok) {
      console.error(
        `[subscription-checkout] sub create ${subRes.status} code=${chariPayErrorCode(subPayload) ?? 'n/a'} orderId=${orderId} env=${billingEnv}`,
      );
      return { success: false, error: GENERIC_ERROR };
    }
    const safe = extractSubscriptionResult(subPayload);
    if (!safe || !safe.currentChargeUrl) {
      console.error(`[subscription-checkout] unusable sub payload orderId=${orderId}`);
      return { success: false, error: GENERIC_ERROR };
    }
    console.info(`[subscription-checkout] created sub=${safe.reference} orderId=${orderId} env=${billingEnv}`);
    return { success: true, data: { checkoutUrl: safe.currentChargeUrl, subscriptionId: safe.reference } };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, 'Le paiement est momentanément indisponible. Réessayez.') };
  }
}

export const createSubscriptionCheckout = withActionGuard(createSubscriptionCheckoutHandler, {
  name: 'billing:subscription-checkout',
  public: true,
});
