import { z } from 'zod';
import { resolvePlan } from '@/features/billing/lib/plans';
import { checkoutCustomerSchema } from '@/features/billing/validations/checkout-customer-schema';
import { normalizePhoneE164 } from '@/features/billing/lib/charipay';

// ---------------------------------------------------------------------------
// Public checkout input validation (pure, no I/O).
// Only plan + customer identity cross the boundary. Amount, currency, price,
// organizationId and any other client-supplied billing fields are stripped
// by the schema (never rejected loudly — they simply cannot influence the
// charge) while plan/customer are strictly validated. The optional
// idempotency key lets the SAME logical checkout safely retry: it is
// forwarded to ChariPay as Idempotency-Key. A fresh key means a fresh
// checkout — clients must reuse the key only for retries of one attempt.
// ---------------------------------------------------------------------------

export const publicCheckoutSchema = z.object({
  plan: z.enum(['STARTER', 'PROFESSIONAL']),
  customer: checkoutCustomerSchema,
  idempotencyKey: z
    .string()
    .regex(/^[\w-]{8,128}$/, 'Clé de requête invalide.')
    .optional(),
});

export type PublicCheckoutInput = z.infer<typeof publicCheckoutSchema>;

export type ValidatedCheckout =
  | {
      success: true;
      data: {
        planId: 'STARTER' | 'PROFESSIONAL';
        priceMad: number;
        customer: {
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
        };
        idempotencyKey: string | undefined;
      };
    }
  | { success: false; error: string };

/**
 * Validate + normalize a public checkout request. Server-side plan catalog
 * wins unconditionally; phone is normalized to E.164 (provider requirement).
 */
export function validateCheckoutInput(input: unknown): ValidatedCheckout {
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

  const phone = normalizePhoneE164(parsed.data.customer.phone);
  if (!phone) {
    return {
      success: false,
      error: 'Numéro de téléphone invalide. Utilisez le format international, par exemple +212600000000.',
    };
  }

  return {
    success: true,
    data: {
      planId: plan.id,
      priceMad: plan.priceMad,
      customer: { ...parsed.data.customer, phone },
      idempotencyKey: parsed.data.idempotencyKey,
    },
  };
}
