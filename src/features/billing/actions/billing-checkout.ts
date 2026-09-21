'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentMembership, assertCan } from '@/lib/assert-role';
import { withActionGuard } from '@/lib/action-guard';
import { BILLING } from '@/lib/notify/messages';
import { normalizeActionError } from '@/lib/action-error';
import {
  createLemonSqueezyCheckout,
  variantIdForPlan,
  type BillingPlan,
} from '@/features/billing/lib/lemonsqueezy';
import type { ActionResponse } from '@/features/billing/types';

const createBillingCheckoutSchema = z.object({
  // Only plan names are accepted from the caller. Variant/price IDs are
  // resolved server-side — arbitrary variantId can never reach Lemon Squeezy.
  plan: z.enum(['STARTER', 'PROFESSIONAL'], { message: BILLING.CHECKOUT.INVALID_PLAN }),
});

type CheckoutResult = { checkoutUrl: string };

async function createBillingCheckoutHandler(
  input: unknown,
): Promise<ActionResponse<CheckoutResult>> {
  try {
    const parsed = createBillingCheckoutSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? BILLING.CHECKOUT.INVALID_PLAN };
    }
    const plan = parsed.data.plan as BillingPlan;

    const membership = await getCurrentMembership();
    // Only owners can purchase: reuse the existing settings:billing gate.
    await assertCan('settings', 'billing');

    const variantId = variantIdForPlan(plan);

    const customer = await prisma.user.findUnique({
      where: { id: membership.userId },
      select: { email: true, firstName: true, lastName: true },
    });
    const customerName = [customer?.firstName, customer?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    // The organization id is server-generated into checkout custom data so
    // the webhook can map the subscription back reliably.
    const { checkoutUrl } = await createLemonSqueezyCheckout({
      variantId,
      organizationId: membership.organizationId,
      customerEmail: customer?.email ?? null,
      customerName: customerName || null,
    });

    return { success: true, data: { checkoutUrl } };
  } catch (error: unknown) {
    return { success: false, error: normalizeActionError(error, BILLING.CHECKOUT.ERROR) };
  }
}

export const createBillingCheckout = withActionGuard(createBillingCheckoutHandler, { name: 'billing:checkout' });
