'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withActionGuard } from '@/lib/action-guard';
import { normalizeActionError } from '@/lib/action-error';
import { resendClaimActivationEmail } from '@/features/billing/lib/activation-email';
import type { ActionResponse } from '@/features/billing/types';

// ---------------------------------------------------------------------------
// Token-based activation email resend (P0 recovery path).
// Public: the purchase token IS the credential (same trust as the activation
// link itself), so no session is required — a customer without a Clerk
// account yet must still be able to request their email. Rate-limited by the
// guard like every public action. Sends at most one email per call to the
// stored claim address; consumed/expired/unknown tokens are rejected.
// ---------------------------------------------------------------------------

const resendSchema = z.object({
  token: z.string().min(1, 'Lien invalide.'),
});

async function resendActivationEmailHandler(
  input: unknown,
): Promise<ActionResponse<{ resent: true }>> {
  try {
    const parsed = resendSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: 'Lien invalide.' };
    }
    const result = await resendClaimActivationEmail(parsed.data.token, { db: prisma });
    if (!result.success) {
      if (result.error === 'invalid') return { success: false, error: 'Lien invalide.' };
      if (result.error === 'expired') {
        return { success: false, error: "Ce lien a expiré. Contactez le support pour recevoir un nouveau lien." };
      }
      if (result.error === 'consumed') {
        return { success: false, error: 'Ce lien a déjà été utilisé.' };
      }
      return { success: false, error: "Envoi impossible pour le moment." };
    }
    return { success: true, data: { resent: true } };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, "Envoi impossible pour le moment.") };
  }
}

export const resendActivationEmail = withActionGuard(resendActivationEmailHandler, {
  name: 'billing:resend-activation',
  public: true,
});
