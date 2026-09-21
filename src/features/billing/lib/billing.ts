import { prisma } from '@/lib/prisma';
import { getCurrentMembership } from '@/lib/assert-role';
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
