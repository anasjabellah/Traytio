import type { SubscriptionStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// SaaS subscription lifecycle (P0): explicit state machine + ordering guard.
// ChariPay sells one-time payment sessions (no recurring-subscription API is
// integrated — see below), so every lifecycle fact arrives as a payment or
// cancellation event. Blind upserts are replaced by two rules:
//   1. Recency: an event older than the stored subscription state never
//      overwrites it (provider timestamps; documented tolerance for skew).
//   2. Transitions: only the table below may change status. Anything else
//      (unknown events, regressions like ACTIVE←FAILED-downgrade) is a no-op.
//
// Transition table (rows = current, columns = event):
//   payment.succeeded → ACTIVE (activation, recovery, renewal, re-subscribe)
//   payment.failed     → PAST_DUE only from ACTIVE/TRIALING; otherwise no-op
//                        (INCOMPLETE stays: never active, nothing to dun;
//                        CANCELED stays: terminal unless a new payment lands)
//   subscription.canceled → CANCELED from anything non-terminal
//
// NOT IMPLEMENTED (provider has no integrated recurring API): automatic
// renewal schedules, dunning emails/grace windows beyond stored PAST_DUE,
// proration, trials created provider-side, self-serve cancel/portal.
// ---------------------------------------------------------------------------

export type BillingLifecycleEvent =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'subscription.canceled';

/** Clock-skew tolerance for the recency guard (generous: provider clocks). */
export const LIFECYCLE_SKEW_TOLERANCE_MS = 10 * 60 * 1000;

/**
 * Pure transition decision. Returns the next status, or null when the event
 * must not change stored state.
 */
export function nextSubscriptionState(
  current: SubscriptionStatus | null | undefined,
  event: BillingLifecycleEvent,
): SubscriptionStatus | null {
  if (event === 'payment.succeeded') return 'ACTIVE';
  if (event === 'payment.failed') {
    if (current === 'ACTIVE' || current === 'TRIALING') return 'PAST_DUE';
    return null;
  }
  if (event === 'subscription.canceled') {
    if (current === 'CANCELED') return null;
    return 'CANCELED';
  }
  return null;
}

/**
 * Best-effort provider event timestamp. Real ChariPay payloads carry
 * CreatedAt/createdAt (ISO string or epoch millis). Null when absent or
 * unparseable — callers must then apply (no ordering information).
 */
export function extractChariPayEventTime(body: unknown): Date | null {
  if (typeof body !== 'object' || body === null) return null;
  const record = body as Record<string, unknown>;
  const raw = record.CreatedAt ?? record.createdAt ?? record.created_at ?? record.timestamp;
  if (typeof raw === 'string' || typeof raw === 'number') {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

/**
 * True when the event is provably older than stored state (beyond skew
 * tolerance). Nulls on either side mean "no ordering information" → apply.
 */
export function isEventStale(
  eventTime: Date | null,
  subscriptionUpdatedAt: Date | null,
  toleranceMs: number = LIFECYCLE_SKEW_TOLERANCE_MS,
): boolean {
  if (!eventTime || !subscriptionUpdatedAt) return false;
  return eventTime.getTime() + toleranceMs < subscriptionUpdatedAt.getTime();
}

/**
 * Compute the next billing period for an ACTIVE subscription: one month
 * from the later of now and the stored period end (early renewals stack
 * instead of truncating).
 */
export function extendBillingPeriod(
  currentPeriodEnd: Date | null,
  now: Date = new Date(),
): { periodStart: Date; periodEnd: Date } {
  const base =
    currentPeriodEnd && currentPeriodEnd.getTime() > now.getTime() ? currentPeriodEnd : now;
  const periodEnd = new Date(base);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  return { periodStart: now, periodEnd };
}
