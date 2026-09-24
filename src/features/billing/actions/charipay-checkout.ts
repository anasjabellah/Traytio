'use server';

import { z } from 'zod';
import { withActionGuard } from '@/lib/action-guard';
import { normalizeActionError } from '@/lib/action-error';
import { resolvePlan } from '@/features/billing/lib/plans';
import { checkoutCustomerSchema } from '@/features/billing/validations/checkout-customer-schema';
import {
  buildChariPaySessionRequest,
  extractSafeSessionResult,
  chariPayErrorCode,
} from '@/features/billing/lib/charipay';
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

const publicCheckoutSchema = z.object({
  plan: z.enum(['STARTER', 'PROFESSIONAL']),
  customer: checkoutCustomerSchema,
});

export type ChariPayCheckoutResult = {
  checkoutUrl: string;
  sessionId: string;
};

async function createChariPayCheckoutSessionHandler(
  input: unknown,
): Promise<ActionResponse<ChariPayCheckoutResult>> {
  const GENERIC_ERROR = 'Le paiement est momentanément indisponible. Réessayez.';
  try {
    const parsed = publicCheckoutSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Veuillez vérifier les informations saisies.',
      };
    }

    const plan = resolvePlan(parsed.data.plan);
    if (!plan) {
      return { success: false, error: 'Formule invalide. Choisissez Starter ou Professional.' };
    }

    const apiKey = process.env.CHARIPAY_API_KEY;
    if (!apiKey) {
      return { success: false, error: GENERIC_ERROR };
    }

    const { url, method, headers, body, debug } = buildChariPaySessionRequest({
      apiKey,
      amountMad: plan.priceMad,
      plan: plan.id,
      customer: parsed.data.customer,
    });

    let res: Response;
    try {
      res = await fetch(url, { method, headers, body: JSON.stringify(body) });
    } catch {
      return { success: false, error: GENERIC_ERROR };
    }

    const payload: unknown = await res.json().catch(() => null);
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

    return { success: true, data: safe };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, GENERIC_ERROR) };
  }
}

export const createChariPayCheckoutSession = withActionGuard(createChariPayCheckoutSessionHandler, {
  name: 'billing:charipay-checkout',
  public: true,
});
