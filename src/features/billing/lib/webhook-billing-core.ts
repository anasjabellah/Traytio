import {
  CHARIPAY_PROVIDER,
  extractChariPayPaymentDetails,
} from '@/features/billing/lib/charipay';
import { resolvePlan } from '@/features/billing/lib/plans';
import {
  provisionSaaSCustomer,
  parseProvisioningOrder,
  PENDING_CLERK_ID_PREFIX,
  type ProvisionedTenant,
} from '@/features/billing/lib/provisioning';
import {
  sendSaaSActivationEmail,
  type ResendClientLike,
} from '@/features/billing/lib/activation-email';
import {
  nextSubscriptionState,
  extractChariPayEventTime,
  isEventStale,
  extendBillingPeriod,
} from '@/features/billing/lib/subscription-lifecycle';
import type { SubscriptionStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Webhook billing core (P0): the full decision tree behind
// POST /api/webhooks/charipay, extracted for execution testing with injected
// fakes. The route keeps verify → parse → persist-tx; everything after the
// event row exists funnels through applyBillingEvent() here.
//
// Outcomes:
//   duplicate   — event already fully processed (or won narrowly); no work,
//                 and crucially no second activation email.
//   applied     — fresh tenant provisioned + activated + emailed.
//   converged   — redelivery converged on an existing tenant; email sent only
//                 if this delivery is the one completing processing.
//   renewed     — payment for an already-claimed account: subscription
//                 extended in place, no tenant, no activation email.
//   ignored     — non-lifecycle event (persisted only by the caller).
//   unmapped    — payload lacks reference/metadata/plan/amount integrity.
//   ambiguous   — payer matches 0 or 2+ organizations; never guess.
//   stale       — event provably older than stored state; no overwrite.
//   no-claim    — tenant exists but no usable claim token (claimed
//                 concurrently, or never issued); nothing emailed.
//   email-failed— tenant + subscription are correct and kept; the activation
//                 email must be retried via the resend path. The caller
//                 answers 2xx (never fail a good payment for a bad mailbox).
//   failed      — provisioning validation/conflict failure (dead-end).
// ---------------------------------------------------------------------------

export type StoredSubscription = {
  organizationId: string;
  plan: string;
  status: SubscriptionStatus;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  priceId: string | null;
  currentPeriodEnd: Date | null;
  updatedAt: Date;
};

export type BillingCoreDb = {
  user: {
    findUnique(args: { where: { email: string } }): Promise<{ id: string; clerkId: string } | null>;
  };
  userOrganization: {
    findMany(args: { where: { userId: string } }): Promise<{ organizationId: string }[]>;
  };
  subscription: {
    findUnique(args: {
      where: { organizationId: string };
    }): Promise<StoredSubscription | null>;
    findFirst(args: {
      where: { providerSubscriptionId: string };
    }): Promise<StoredSubscription | null>;
    create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
    update(args: {
      where: { organizationId: string };
      data: Record<string, unknown>;
    }): Promise<unknown>;
  };
  purchaseClaim: {
    findFirst(args: {
      where: { userId: string; consumedAt: null };
    }): Promise<{ token: string } | null>;
  };
  billingWebhookEvent: {
    findUnique(args: {
      where: { provider_providerEventId: { provider: string; providerEventId: string } };
    }): Promise<{ processedAt: Date | null } | null>;
    updateMany(args: {
      where: { provider: string; providerEventId: string; processedAt?: null };
      data: { organizationId?: string | null; processedAt?: Date };
    }): Promise<{ count: number }>;
  };
};

export type BillingEventResult =
  | { outcome: 'applied' | 'converged' | 'renewed' | 'status-updated'; organizationId: string; emailSent: boolean }
  | { outcome: 'duplicate' | 'ignored'; organizationId: string | null; emailSent: false }
  | {
      outcome: 'unmapped' | 'ambiguous' | 'stale' | 'no-claim' | 'failed' | 'conflict' | 'email-failed';
      organizationId: string | null;
      emailSent: false;
      reason: string;
    };

export type BillingEventInput = {
  providerEventId: string;
  eventType: string;
  body: unknown;
};

type CoreDeps = {
  db: BillingCoreDb;
  provision?: (input: unknown) => Promise<ProvisionedTenant>;
  mailer?: ResendClientLike;
  clock?: () => Date;
};

function log(...args: unknown[]): void {
  console.info('[billing-core]', ...args);
}

/**
 * Terminal settle for an event row: link the tenant org and, when done,
 * stamp processedAt. Conditional on processedAt:null so concurrent
 * completions converge instead of clobbering. Email-failure settles with
 * done=false (org linked for operability, row stays retryable).
 */
async function settleEvent(
  db: BillingCoreDb,
  providerEventId: string,
  organizationId: string | null,
  done: boolean,
): Promise<void> {
  await db.billingWebhookEvent.updateMany({
    where: { provider: CHARIPAY_PROVIDER, providerEventId, processedAt: null },
    data: {
      ...(organizationId ? { organizationId } : {}),
      ...(done ? { processedAt: new Date() } : {}),
    },
  });
}

function asEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length > 0 ? email : null;
}

/**
 * Resolve the owning organization for a payer email without guessing:
 * exactly one membership wins; zero or many is an explicit dead-end.
 */
async function resolveOrgForEmail(
  db: BillingCoreDb,
  email: string,
): Promise<{ organizationId: string } | { ambiguous: true } | null> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;
  if (user.clerkId.startsWith(PENDING_CLERK_ID_PREFIX)) return null;
  const memberships = await db.userOrganization.findMany({ where: { userId: user.id } });
  if (memberships.length !== 1 || !memberships[0]) return { ambiguous: true };
  return { organizationId: memberships[0].organizationId };
}

export async function applyBillingEvent(
  input: BillingEventInput,
  deps: CoreDeps,
): Promise<BillingEventResult> {
  const { providerEventId, eventType, body } = input;
  const { db } = deps;
  const now = deps.clock ? deps.clock() : new Date();
  const provision = deps.provision ?? ((order: unknown) => provisionSaaSCustomer(order));

  // Normalize ChariPay subscription payment event names to the core lifecycle
  // (docs emit both payment.* and subscription.payment_* for recurring).
  const normalizedType =
    eventType === 'subscription.payment_succeeded'
      ? 'payment.succeeded'
      : eventType === 'subscription.payment_failed'
        ? 'payment.failed'
        : eventType;

  if (normalizedType !== 'payment.succeeded' && normalizedType !== 'payment.failed') {
    if (normalizedType === 'subscription.canceled') {
      return applyCancellation(providerEventId, body, deps);
    }
    await settleEvent(db, providerEventId, null, true);
    return { outcome: 'ignored', organizationId: null, emailSent: false };
  }

  const details = extractChariPayPaymentDetails(body);
  const metadata = details?.metadata ?? null;
  const plan = resolvePlan(typeof metadata?.plan === 'string' ? metadata.plan : undefined);
  if (!details || !metadata || !plan) {
    log(`unprovisionable ${providerEventId}: missing reference/metadata/plan`);
    await settleEvent(db, providerEventId, null, true);
    return { outcome: 'unmapped', organizationId: null, emailSent: false, reason: 'mapping' };
  }
  if (details.amount !== null && details.amount !== plan.priceMad) {
    log(`unprovisionable ${providerEventId}: amount mismatch paid=${details.amount} plan=${plan.priceMad}`);
    await settleEvent(db, providerEventId, null, true);
    return { outcome: 'unmapped', organizationId: null, emailSent: false, reason: 'amount' };
  }

  const email = asEmail(metadata.email);
  if (!email) {
    log(`unprovisionable ${providerEventId}: missing customer email`);
    await settleEvent(db, providerEventId, null, true);
    return { outcome: 'unmapped', organizationId: null, emailSent: false, reason: 'email' };
  }
  const customer = {
    firstName: metadata.firstName,
    lastName: metadata.lastName,
    email,
    phone: metadata.phone,
  };

  if (normalizedType === 'payment.failed') {
    return applyFailedPayment(providerEventId, body, email, deps);
  }

  // --- payment.succeeded below -------------------------------------------

  // 1. Existing claimed account? → renewal in place (no tenant, no email).
  const existing = await resolveOrgForEmail(db, email);
  if (existing && 'ambiguous' in existing) {
    log(`ambiguous payer ${providerEventId}: 0 or 2+ organizations, refusing to guess`);
    await settleEvent(db, providerEventId, null, true);
    return { outcome: 'ambiguous', organizationId: null, emailSent: false, reason: 'org' };
  }
  if (existing && 'organizationId' in existing) {
    return attachRenewal(providerEventId, body, existing.organizationId, plan.id, deps, now);
  }

  // 2. Fresh (or redelivered) order → idempotent provisioning.
  // Pre-validate first: malformed orders dead-end (retry is futile), while
  // tenant conflicts from concurrent redeliveries stay retryable.
  const precheck = parseProvisioningOrder({
    provider: CHARIPAY_PROVIDER,
    providerReference: details.reference,
    plan: plan.id,
    customer,
  });
  if (!precheck.success) {
    log(`provisioning validation failed for ${providerEventId}`);
    await settleEvent(db, providerEventId, null, true);
    return { outcome: 'failed', organizationId: null, emailSent: false, reason: 'provision' };
  }
  const provisioned = await provision({
    provider: CHARIPAY_PROVIDER,
    providerReference: details.reference,
    plan: plan.id,
    customer,
  });
  if (!provisioned.success) {
    // A concurrent redelivery is likely mid-flight (or just won): leave the
    // event unprocessed so the provider retry converges instead of dying.
    log(`provisioning conflict for ${providerEventId}, leaving retryable`);
    return { outcome: 'conflict', organizationId: null, emailSent: false, reason: 'provision' };
  }

  // 3. Activate: INCOMPLETE → ACTIVE with a real period. Fresh tenants get
  //    now → +1mo; converged replays extend from the stored end. A provably
  //    stale event skips the write (recency guard).
  const activated = await activateSubscription(
    db,
    provisioned.organizationId || (await orgIdForUser(db, provisioned.userId)),
    plan.id,
    now,
    extractChariPayEventTime(body),
  );
  if (!activated) {
    await settleEvent(db, providerEventId, null, true);
    return { outcome: 'failed', organizationId: null, emailSent: false, reason: 'activate' };
  }
  const organizationId = activated.organizationId;
  if (!activated.applied) {
    await settleEvent(db, providerEventId, organizationId, true);
    return { outcome: 'stale', organizationId, emailSent: false, reason: 'ordering' };
  }

  // 4. Re-read the event gate AFTER provisioning: a concurrent duplicate may
  //    have completed (and emailed) while we worked — then skip the email.
  const gate = await db.billingWebhookEvent.findUnique({
    where: { provider_providerEventId: { provider: CHARIPAY_PROVIDER, providerEventId } },
  });
  if (gate?.processedAt) {
    return { outcome: 'duplicate', organizationId, emailSent: false };
  }

  // 5. Claim token for the activation email (absent when another delivery
  //    already drove signup to completion — then there is nothing to mail).
  const claim = await db.purchaseClaim.findFirst({
    where: { userId: provisioned.userId, consumedAt: null },
  });
  if (!claim) {
    await settleEvent(db, providerEventId, organizationId, true);
    return { outcome: 'no-claim', organizationId, emailSent: false, reason: 'claim' };
  }

  const mailed = await sendSaaSActivationEmail(
    {
      to: email,
      firstName: typeof customer.firstName === 'string' ? customer.firstName : '',
      plan: plan.id,
      token: claim.token,
    },
    deps.mailer ? { client: deps.mailer } : {},
  );
  if (!mailed.success) {
    // Tenant + claim stay intact and the org is linked for operability, but
    // the event stays unprocessed-at-email-level ONLY via the resend path:
    // the caller answers 2xx (never fail a good payment for a bad mailbox)
    // and the token-based resend endpoint recovers without a new payment.
    // A provider redelivery still converges safely (processed gate skips it).
    log(`activation email failed for ${providerEventId}`);
    await deps.db.billingWebhookEvent.updateMany({
      where: { provider: CHARIPAY_PROVIDER, providerEventId, processedAt: null },
      data: { organizationId },
    });
    return { outcome: 'email-failed', organizationId, emailSent: false, reason: 'email' };
  }

  log(`provisioned org=${organizationId} event=${providerEventId}`);
  await settleEvent(db, providerEventId, organizationId, true);
  return { outcome: provisioned.created ? 'applied' : 'converged', organizationId, emailSent: true };
}

async function orgIdForUser(db: BillingCoreDb, userId: string): Promise<string> {
  const memberships = await db.userOrganization.findMany({ where: { userId } });
  return memberships.length === 1 && memberships[0] ? memberships[0].organizationId : '';
}

/**
 * Set (or extend) an ACTIVE subscription for a known organization.
 * Honors recency + the transition table; never invents provider ids.
 */
async function activateSubscription(
  db: BillingCoreDb,
  organizationId: string,
  planId: string,
  now: Date,
  eventTime: Date | null = null,
): Promise<{ organizationId: string; applied: boolean } | null> {
  if (!organizationId) return null;
  const current = await db.subscription.findUnique({ where: { organizationId } });
  if (current && isEventStale(eventTime, current.updatedAt)) {
    log(`stale event skipped for org=${organizationId}`);
    return { organizationId, applied: false };
  }
  const next = nextSubscriptionState(current?.status ?? null, 'payment.succeeded');
  if (!next) return { organizationId, applied: true };
  const period = extendBillingPeriod(current?.currentPeriodEnd ?? null, now);
  if (current) {
    await db.subscription.update({
      where: { organizationId },
      data: {
        plan: planId,
        status: next,
        provider: CHARIPAY_PROVIDER,
        currentPeriodStart: period.periodStart,
        currentPeriodEnd: period.periodEnd,
      },
    });
  } else {
    await db.subscription.create({
      data: {
        organizationId,
        provider: CHARIPAY_PROVIDER,
        providerCustomerId: null,
        providerSubscriptionId: null,
        plan: planId,
        status: next,
        priceId: null,
        currentPeriodStart: period.periodStart,
        currentPeriodEnd: period.periodEnd,
        trialEnd: null,
        cancelAtPeriodEnd: false,
      },
    });
  }
  return { organizationId, applied: true };
}

async function attachRenewal(
  providerEventId: string,
  body: unknown,
  organizationId: string,
  planId: string,
  deps: CoreDeps,
  now: Date,
): Promise<BillingEventResult> {
  const current = await deps.db.subscription.findUnique({ where: { organizationId } });
  const eventTime = extractChariPayEventTime(body);
  if (current && isEventStale(eventTime, current.updatedAt)) {
    log(`stale renewal skipped org=${organizationId} event=${providerEventId}`);
    await settleEvent(deps.db, providerEventId, organizationId, true);
    return { outcome: 'stale', organizationId, emailSent: false, reason: 'ordering' };
  }
  const period = extendBillingPeriod(current?.currentPeriodEnd ?? null, now);
  if (current) {
    await deps.db.subscription.update({
      where: { organizationId },
      data: {
        plan: planId,
        status: 'ACTIVE',
        provider: CHARIPAY_PROVIDER,
        currentPeriodStart: period.periodStart,
        currentPeriodEnd: period.periodEnd,
      },
    });
  } else {
    await deps.db.subscription.create({
      data: {
        organizationId,
        provider: CHARIPAY_PROVIDER,
        providerCustomerId: null,
        providerSubscriptionId: null,
        plan: planId,
        status: 'ACTIVE',
        priceId: null,
        currentPeriodStart: period.periodStart,
        currentPeriodEnd: period.periodEnd,
        trialEnd: null,
        cancelAtPeriodEnd: false,
      },
    });
  }
  log(`renewed org=${organizationId} event=${providerEventId}`);
  await settleEvent(deps.db, providerEventId, organizationId, true);
  return { outcome: 'renewed', organizationId, emailSent: false };
}

async function applyFailedPayment(
  providerEventId: string,
  body: unknown,
  email: string,
  deps: CoreDeps,
): Promise<BillingEventResult> {
  const resolved = await resolveOrgForEmail(deps.db, email);
  if (!resolved || 'ambiguous' in resolved) {
    log(`failed payment unattributable ${providerEventId}`);
    await settleEvent(deps.db, providerEventId, null, true);
    return { outcome: 'ambiguous', organizationId: null, emailSent: false, reason: 'org' };
  }
  const current = await deps.db.subscription.findUnique({
    where: { organizationId: resolved.organizationId },
  });
  const next = nextSubscriptionState(current?.status ?? null, 'payment.failed');
  if (current && next) {
    await deps.db.subscription.update({
      where: { organizationId: resolved.organizationId },
      data: { status: next },
    });
    log(`past-due org=${resolved.organizationId} event=${providerEventId}`);
    await settleEvent(deps.db, providerEventId, resolved.organizationId, true);
    return { outcome: 'status-updated', organizationId: resolved.organizationId, emailSent: false };
  }
  await settleEvent(deps.db, providerEventId, resolved.organizationId, true);
  return { outcome: 'renewed', organizationId: resolved.organizationId, emailSent: false };
}

async function applyCancellation(
  providerEventId: string,
  body: unknown,
  deps: CoreDeps,
): Promise<BillingEventResult> {
  const record =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null;
  const rawSub =
    record?.providerSubscriptionId ?? record?.subscriptionId ?? record?.subscription_id ?? null;
  const rawEmail =
    record?.customerEmail ?? (record?.customer as Record<string, unknown> | undefined)?.email ?? null;

  let organizationId: string | null = null;
  if (typeof rawSub === 'string' && rawSub) {
    const match = await deps.db.subscription.findFirst({
      where: { providerSubscriptionId: rawSub },
    });
    if (match) organizationId = match.organizationId;
  }
  if (!organizationId) {
    const email = asEmail(rawEmail);
    if (email) {
      const resolved = await resolveOrgForEmail(deps.db, email);
      if (resolved && 'organizationId' in resolved) organizationId = resolved.organizationId;
      else {
        log(`cancellation unattributable ${providerEventId}`);
        await settleEvent(deps.db, providerEventId, null, true);
        return { outcome: 'ambiguous', organizationId: null, emailSent: false, reason: 'org' };
      }
    }
  }
  if (!organizationId) {
    log(`cancellation unattributable ${providerEventId}`);
    await settleEvent(deps.db, providerEventId, null, true);
    return { outcome: 'ambiguous', organizationId: null, emailSent: false, reason: 'org' };
  }
  const current = await deps.db.subscription.findUnique({ where: { organizationId } });
  const next = nextSubscriptionState(current?.status ?? null, 'subscription.canceled');
  if (current && next) {
    await deps.db.subscription.update({
      where: { organizationId },
      data: { status: next },
    });
    log(`canceled org=${organizationId} event=${providerEventId}`);
    await settleEvent(deps.db, providerEventId, organizationId, true);
    return { outcome: 'status-updated', organizationId, emailSent: false };
  }
  await settleEvent(deps.db, providerEventId, organizationId, true);
  return { outcome: 'renewed', organizationId, emailSent: false };
}
