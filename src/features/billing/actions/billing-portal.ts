'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentMembership } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { BILLING } from '@/lib/notify/messages';
import { normalizeActionError } from '@/lib/action-error';
import { retrieveLemonSqueezySubscription } from '@/features/billing/lib/lemonsqueezy';
import type { ActionResponse } from '@/features/billing/types';

type PortalResult = { portalUrl: string };

async function getBillingPortalUrlHandler(): Promise<ActionResponse<PortalResult>> {
  try {
    const membership = await getCurrentMembership();

    // Customer/subscription ids come from our own Subscription row — never
    // from the client.
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: membership.organizationId },
      select: { provider: true, providerSubscriptionId: true },
    });

    if (!subscription || subscription.provider !== 'lemonsqueezy' || !subscription.providerSubscriptionId) {
      return { success: false, error: BILLING.PORTAL.NO_SUBSCRIPTION };
    }

    // Portal URLs are pre-signed for 24h — always fetched fresh, never stored.
    const remote = await retrieveLemonSqueezySubscription(subscription.providerSubscriptionId);
    const portalUrl = remote.attributes?.urls?.customer_portal ?? null;
    if (!portalUrl) {
      return { success: false, error: BILLING.PORTAL.NO_PORTAL_URL };
    }

    return { success: true, data: { portalUrl } };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, BILLING.PORTAL.ERROR) };
  }
}

export const getBillingPortalUrl = withActionGuard(getBillingPortalUrlHandler, { name: 'billing:portal' });
