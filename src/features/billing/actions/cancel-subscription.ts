'use server';

import { withActionGuard } from '@/lib/action-guard';
import { getCurrentMembership, assertCan } from '@/lib/assert-role';
import { prisma } from '@/lib/prisma';
import { normalizeActionError } from '@/lib/action-error';
import { assertBillingEnvSafe } from '@/features/billing/lib/billing-env';
import type { ActionResponse } from '@/features/billing/types';

// ---------------------------------------------------------------------------
// Cancel SaaS subscription — OWNER only, server-derived organization.
// Calls ChariPay POST /v1/subscriptions/{reference}/cancel. The webhook
// remains authoritative for local state (subscription.canceled → CANCELED),
// but we optimistically mark cancelAtPeriodEnd locally for UX.
// Idempotent: repeated calls with same subscription are safe (409 → success).
// ---------------------------------------------------------------------------

async function cancelSubscriptionHandler(): Promise<ActionResponse<{ canceled: true }>> {
  try {
    const membership = await getCurrentMembership();
    await assertCan('settings', 'billing');

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: membership.organizationId },
    });
    if (!subscription || !subscription.providerSubscriptionId) {
      return { success: false, error: 'Aucun abonnement actif trouvé.' };
    }
    if (subscription.provider !== 'charipay') {
      return { success: false, error: 'Annulation non disponible pour ce fournisseur.' };
    }
    if (subscription.status === 'CANCELED') {
      return { success: true, data: { canceled: true } };
    }

    const apiKey = process.env.CHARIPAY_API_KEY;
    if (!apiKey) return { success: false, error: 'Configuration de facturation manquante.' };
    assertBillingEnvSafe(apiKey);

    const url = `https://api-psp.charipay.ma/v1/subscriptions/${encodeURIComponent(subscription.providerSubscriptionId)}/cancel`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CHARI-PAY-API-KEY': apiKey,
        'Idempotency-Key': `cancel-${subscription.providerSubscriptionId}`,
        'X-Request-Id': crypto.randomUUID(),
      },
    });
    if (!res.ok && res.status !== 409) {
      const payload: unknown = await res.json().catch(() => null);
      const code =
        typeof payload === 'object' && payload !== null && (payload as { error?: { code?: unknown } }).error?.code;
      console.error(`[cancel-subscription] ${res.status} code=${typeof code === 'string' ? code : 'n/a'}`);
      return { success: false, error: 'Annulation impossible pour le moment.' };
    }

    // Optimistic local mark; webhook will confirm CANCELED.
    await prisma.subscription.update({
      where: { organizationId: membership.organizationId },
      data: { cancelAtPeriodEnd: true },
    });

    return { success: true, data: { canceled: true } };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, 'Annulation impossible pour le moment.') };
  }
}

export const cancelSubscription = withActionGuard(cancelSubscriptionHandler, {
  name: 'billing:cancel-subscription',
});
