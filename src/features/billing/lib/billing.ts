import { prisma } from '@/lib/prisma';
import { getCurrentMembership, type Membership } from '@/lib/assert-role';
import { NextResponse } from 'next/server';
import { BILLING } from '@/lib/notify/messages';
import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

export type OrganizationSubscription = {
  id: string;
  organizationId: string;
  provider: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  priceId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Statuses that grant product access. PAST_DUE is a grace state and does
// NOT grant access (strict semantics — dunning must resolve first).
const ACTIVE_STATUSES: SubscriptionStatus[] = ['TRIALING', 'ACTIVE'];

/**
 * The caller's organization subscription, or null when the organization
 * has never subscribed. Organization is resolved from the authenticated
 * membership — never from client input.
 */
export async function getOrganizationSubscription(): Promise<OrganizationSubscription | null> {
  const membership = await getCurrentMembership();
  return prisma.subscription.findUnique({
    where: { organizationId: membership.organizationId },
  });
}

/**
 * Raw subscription status, or null when there is no subscription.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  const subscription = await getOrganizationSubscription();
  return subscription?.status ?? null;
}

/**
 * Whether the caller's organization currently holds an ACTIVE or TRIALING
 * subscription. No subscription, or any other status, returns false.
 */
export async function hasActiveSubscription(): Promise<boolean> {
  const status = await getSubscriptionStatus();
  return status !== null && ACTIVE_STATUSES.includes(status);
}

/**
 * Authoritative billing plan, or null when there is no subscription.
 *
 * Plan transition note: the legacy Organization.plan free-String field is
 * intentionally ignored here — it has zero readers and must not become a
 * second source of truth. Subscription.plan is authoritative.
 */
export async function getCurrentPlan(): Promise<SubscriptionPlan | null> {
  const subscription = await getOrganizationSubscription();
  return subscription?.plan ?? null;
}

/**
 * Whether the caller's organization is on one of the given plans AND that
 * subscription grants access (ACTIVE or TRIALING).
 */
export async function hasPlan(...plans: SubscriptionPlan[]): Promise<boolean> {
  const subscription = await getOrganizationSubscription();
  if (!subscription) return false;
  return plans.includes(subscription.plan) && ACTIVE_STATUSES.includes(subscription.status);
}

// ---------------------------------------------------------------------------
// Centralized subscription entitlement (P0 enforcement layer).
//
// Statuses (from the Subscription model — never invented here):
//   ACTIVE / TRIALING  → entitled (paid or trialing).
//   INCOMPLETE         → payment seen but provisioning/activation incomplete.
//   PAST_DUE           → strict: no grace period exists in the product, so no
//                         access until the provider reports recovery.
//   CANCELED / INCOMPLETE_EXPIRED / UNPAID / null (no row) → not entitled.
// SUPERADMIN bypasses (mirrors assertCan) so platform operators are never
// locked out by tenant billing state.
// ---------------------------------------------------------------------------

/** Machine-readable denial for the entitlement layer. */
export class SubscriptionRequiredError extends Error {
  readonly code = 'SUBSCRIPTION_REQUIRED' as const;
  constructor(message = 'Subscription required') {
    super(message);
    this.name = 'SubscriptionRequiredError';
  }
}

/**
 * Pure entitlement decision over a subscription status.
 * Null/undefined (no subscription row) is never entitled.
 */
export function isEntitledStatus(status: SubscriptionStatus | null | undefined): boolean {
  if (status === null || status === undefined) return false;
  return ACTIVE_STATUSES.includes(status);
}

export type EntitlementContext = {
  organizationId: string;
  subscription: OrganizationSubscription | null;
};

/**
 * Single server-side subscription guard: authenticate → resolve the
 * organization from the authenticated server context (never client input)
 * → verify membership → verify entitlement.
 *
 * The optional overrides exist ONLY for tests (dependency injection).
 * Production callers never pass them: membership always comes from
 * getCurrentMembership() (Clerk session) and the subscription always comes
 * from the database scoped to that membership.
 *
 * @throws SubscriptionRequiredError when the organization is not entitled.
 * @throws the underlying auth error when the caller is unauthenticated.
 */
export async function requireActiveSubscription(
  overrides: {
    membership?: Membership;
    subscription?: OrganizationSubscription | null;
  } = {},
): Promise<EntitlementContext> {
  const membership = overrides.membership ?? (await getCurrentMembership());

  if (membership.role === 'SUPERADMIN') {
    const subscription =
      overrides.subscription !== undefined
        ? overrides.subscription
        : await prisma.subscription.findUnique({
            where: { organizationId: membership.organizationId },
          });
    return { organizationId: membership.organizationId, subscription };
  }

  const subscription =
    overrides.subscription !== undefined
      ? overrides.subscription
      : await prisma.subscription.findUnique({
          where: { organizationId: membership.organizationId },
        });

  // Fail closed: an injected subscription for another organization can never
  // grant access (the override path exists only for tests; production always
  // reads the subscription scoped to the resolved membership).
  if (
    overrides.subscription !== undefined &&
    overrides.subscription !== null &&
    overrides.subscription.organizationId !== membership.organizationId
  ) {
    throw new SubscriptionRequiredError();
  }

  if (!isEntitledStatus(subscription?.status ?? null)) {
    throw new SubscriptionRequiredError();
  }

  return { organizationId: membership.organizationId, subscription };
}

/**
 * Route-handler convenience wrapper around requireActiveSubscription.
 * Returns a 403 JSON response when the organization is not entitled, or
 * null when the request may proceed. Auth/unexpected errors propagate to
 * the caller's own error handling.
 */
export async function subscriptionDenialResponse(
  overrides: {
    membership?: Membership;
    subscription?: OrganizationSubscription | null;
  } = {},
): Promise<NextResponse | null> {
  try {
    await requireActiveSubscription(overrides);
  } catch (err: unknown) {
    if (err instanceof SubscriptionRequiredError) {
      return NextResponse.json({ error: BILLING.SUBSCRIPTION_REQUIRED }, { status: 403 });
    }
    throw err;
  }
  return null;
}
