import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { resolvePlan, type PurchasablePlan } from '@/features/billing/lib/plans';
import { checkoutCustomerSchema } from '@/features/billing/validations/checkout-customer-schema';

// ---------------------------------------------------------------------------
// SaaS provisioning foundation (Phase 1) — PURE contract + validation only.
// This module defines WHAT a confirmed payment must contain for provisioning
// and normalizes it into a trusted order. It performs NO database writes:
// User, Organization, and Subscription creation arrive in Phase 2, keyed off
// the idempotencyKey derived here and enforced by BillingWebhookEvent's
// @@unique([provider, providerEventId]).
// Only 'charipay' is supported. Mock/Lemon Squeezy must never reach this
// service (explicit allowlist, not a denylist).
// ---------------------------------------------------------------------------

export const SUPPORTED_PROVISIONING_PROVIDERS = ['charipay'] as const;

export type SupportedProvisioningProvider = (typeof SUPPORTED_PROVISIONING_PROVIDERS)[number];

/** Raw input accepted from the (server-side) confirmed-payment caller. */
const provisioningOrderSchema = z
  .object({
    provider: z.enum(SUPPORTED_PROVISIONING_PROVIDERS, {
      message: 'Fournisseur de paiement non pris en charge.',
    }),
    providerReference: z
      .string()
      .trim()
      .min(1, 'Référence de paiement requise.')
      .max(200, 'Référence de paiement trop longue.'),
    plan: z.enum(['STARTER', 'PROFESSIONAL'], {
      message: 'Formule invalide. Choisissez Starter ou Professional.',
    }),
    customer: checkoutCustomerSchema,
  })
  // Strict: organizationId, status, price/amount/currency smuggled by a
  // caller are rejected instead of silently dropped.
  .strict();

export type ProvisioningOrderInput = z.infer<typeof provisioningOrderSchema>;

export type ProvisioningOrder = {
  provider: SupportedProvisioningProvider;
  /** Provider-side payment/event reference (authoritative dedup input). */
  providerReference: string;
  plan: PurchasablePlan;
  /** Server-resolved from the plan catalog — never caller-supplied. */
  priceMad: number;
  currency: 'MAD';
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  /**
   * Stable idempotency key for this order. Phase 2 persists provisioning
   * guarded by it (via the stored BillingWebhookEvent row), so redeliveries
   * of the same provider reference converge instead of duplicating.
   */
  idempotencyKey: string;
};

/** Derive the stable idempotency key — deterministic per provider reference. */
export function deriveProvisioningKey(provider: string, providerReference: string): string {
  return crypto
    .createHash('sha256')
    .update(`saas-provision:v1:${provider}:${providerReference}`)
    .digest('hex');
}

export type ParsedProvisioningOrder =
  | { success: true; order: ProvisioningOrder }
  | { success: false; error: string };

/**
 * Validate + normalize a confirmed-payment payload into a trusted order.
 * Pure function: no I/O, no database, no side effects.
 */
export function parseProvisioningOrder(input: unknown): ParsedProvisioningOrder {
  const parsed = provisioningOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Commande invalide.' };
  }

  const plan = resolvePlan(parsed.data.plan);
  if (!plan) {
    return { success: false, error: 'Formule invalide. Choisissez Starter ou Professional.' };
  }

  const { provider, providerReference, customer } = parsed.data;
  return {
    success: true,
    order: {
      provider,
      providerReference,
      plan: plan.id,
      priceMad: plan.priceMad,
      currency: plan.currency,
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
      idempotencyKey: deriveProvisioningKey(provider, providerReference),
    },
  };
}

// ---------------------------------------------------------------------------
// Phase 2 — actual database provisioning. Creates, atomically:
//   User + Organization + OWNER UserOrganization + Subscription.
// No Clerk account exists yet at this point, but User.clerkId is NOT NULL,
// so the row is created with a namespaced placeholder
// (`pending:<idempotencyKey>`) that Phase 3 (Clerk invite/claim) must
// resolve to the real Clerk identity BEFORE the customer signs up —
// otherwise user.created would collide on the unique email. The placeholder
// is deterministic per provider reference, which doubles as the
// idempotency anchor: a redelivered order finds the same row instead of
// creating a second tenant. No schema change was required:
// phone lives on the existing Organization.phone field.
// ---------------------------------------------------------------------------

/** Namespace marking a pre-Clerk SaaS user awaiting identity claim. */
export const PENDING_CLERK_ID_PREFIX = 'pending:';

export function pendingClerkId(idempotencyKey: string): string {
  return `${PENDING_CLERK_ID_PREFIX}${idempotencyKey}`;
}

export type ProvisioningDb = {
  $transaction<T>(fn: (tx: ProvisioningTx) => Promise<T>): Promise<T>;
};

export type ProvisioningTx = {
  user: {
    findUnique(args: { where: { clerkId: string } }): Promise<{ id: string } | null>;
    create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
  };
  organization: {
    create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
  };
  userOrganization: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
  };
  subscription: {
    create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
  };
  purchaseClaim: {
    create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
  };
};

export type ProvisionedTenant =
  | {
      success: true;
      userId: string;
      organizationId: string;
      subscriptionId: string;
      plan: PurchasablePlan;
      priceMad: number;
      /** False when the order was already provisioned (idempotent replay). */
      created: boolean;
    }
  | { success: false; error: string };

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  );
}

function orgSlug(): string {
  return `traytio-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Provision a SaaS tenant from a validated provisioning order.
 * Server-side only. Everything (plan, price, status, org linkage) is
 * derived here — the input carries no organizationId, no status, no price.
 */
export async function provisionSaaSCustomer(
  input: unknown,
  deps: { db?: ProvisioningDb } = {},
): Promise<ProvisionedTenant> {
  const parsed = parseProvisioningOrder(input);
  if (!parsed.success) return { success: false, error: parsed.error };
  const order = parsed.order;

  const db: ProvisioningDb = deps.db ?? (prisma as unknown as ProvisioningDb);
  const placeholder = pendingClerkId(order.idempotencyKey);

  const readExisting = async (
    findUser: (clerkId: string) => Promise<{ id: string } | null>,
  ): Promise<ProvisionedTenant | null> => {
    // Idempotency anchor: the deterministic placeholder row. A full tenant
    // re-read would need Subscription joins; the presence of the user row
    // created by this same order is sufficient to converge redeliveries.
    const existing = await findUser(placeholder);
    if (!existing) return null;
    return {
      success: true,
      userId: existing.id,
      organizationId: '',
      subscriptionId: '',
      plan: order.plan,
      priceMad: order.priceMad,
      created: false,
    };
  };

  try {
    return await db.$transaction(async (tx) => {
      const replay = await readExisting((clerkId) => tx.user.findUnique({ where: { clerkId } }));
      if (replay) return replay;

      const periodStart = new Date();
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const user = await tx.user.create({
        data: {
          clerkId: placeholder,
          email: order.customer.email,
          firstName: order.customer.firstName,
          lastName: order.customer.lastName,
        },
      });

      const orgName =
        `${order.customer.firstName} ${order.customer.lastName}`.trim() || 'Mon Organisation';
      const organization = await tx.organization.create({
        data: {
          name: orgName,
          slug: orgSlug(),
          email: order.customer.email,
          phone: order.customer.phone,
        },
      });

      await tx.userOrganization.create({
        data: { userId: user.id, organizationId: organization.id, role: 'OWNER' },
      });

      // INCOMPLETE (not ACTIVE): the one-time payment is confirmed, but no
      // recurring ChariPay subscription exists yet. ACTIVE would misstate
      // recurring state; access mapping for INCOMPLETE is a later decision.
      // providerCustomerId/providerSubscriptionId stay NULL — inventing
      // provider IDs would corrupt future webhook reconciliation.
      const subscription = await tx.subscription.create({
        data: {
          organizationId: organization.id,
          provider: order.provider,
          providerCustomerId: null,
          providerSubscriptionId: null,
          plan: order.plan,
          status: 'INCOMPLETE',
          priceId: null,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialEnd: null,
          cancelAtPeriodEnd: false,
        },
      });

      // Phase 3A: issue the single-use activation token binding this order
      // to its pending tenant. The URL carries only this random token.
      await tx.purchaseClaim.create({
        data: {
          token: generatePurchaseToken(),
          email: order.customer.email,
          userId: user.id,
          organizationId: organization.id,
          idempotencyKey: order.idempotencyKey,
          expiresAt: new Date(Date.now() + PURCHASE_TOKEN_TTL_MS),
        },
      });

      return {
        success: true as const,
        userId: user.id,
        organizationId: organization.id,
        subscriptionId: subscription.id,
        plan: order.plan,
        priceMad: order.priceMad,
        created: true as const,
      };
    });
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      // Concurrent redelivery won the race: converge to the winner instead
      // of failing. A same-email/different-reference collision surfaces as
      // a conflict, not a silent takeover.
      try {
        const winner = await (db as unknown as {
          user: { findUnique(args: { where: { clerkId: string } }): Promise<{ id: string } | null> };
        }).user.findUnique({ where: { clerkId: placeholder } });
        if (winner) {
          return {
            success: true,
            userId: winner.id,
            organizationId: '',
            subscriptionId: '',
            plan: order.plan,
            priceMad: order.priceMad,
            created: false,
          };
        }
      } catch {
        // Fall through to the generic conflict below.
      }
      return { success: false, error: 'Cette commande a déjà été traitée ou le compte existe déjà.' };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Phase 3A — paid-customer Clerk claim. A pending tenant (User.clerkId =
// 'pending:<idempotencyKey>') is claimed when its owner creates a real
// Clerk account: the placeholder is swapped for the real Clerk userId,
// the purchase token is consumed atomically, and org/membership/
// subscription are preserved untouched. No second tenant is ever created.
// ---------------------------------------------------------------------------

/** Purchase-token lifetime: 7 days, consistent with team invitations. */
export const PURCHASE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Cryptographically random token. The URL carries only this value. */
export function generatePurchaseToken(): string {
  return crypto.randomUUID();
}

export type PurchaseClaimRow = {
  id: string;
  token: string;
  email: string;
  userId: string;
  organizationId: string;
  idempotencyKey: string;
  expiresAt: Date;
  consumedAt: Date | null;
};

export type ClaimValidation =
  | {
      valid: true;
      claim: {
        email: string;
        organizationId: string;
        organizationName: string | null;
        plan: string | null;
        expiresAt: Date;
      };
    }
  | { valid: false; reason: 'invalid' | 'expired' | 'consumed' };

export type ClaimReaderDb = {
  purchaseClaim: {
    findUnique(args: {
      where: { token: string };
      include?: { organization: { select: { name: boolean } } };
    }): Promise<
      | (PurchaseClaimRow & { organization?: { name: string | null } | null })
      | null
    >;
  };
  subscription: {
    findUnique(args: { where: { organizationId: string } }): Promise<{ plan: string } | null>;
  };
};

/**
 * Validate a purchase token for display (sign-up gating, activation page).
 * Read-only. Never reveals database IDs beyond the owning org linkage
 * needed to render the activation screen.
 */
export async function getPurchaseClaimByToken(
  token: string,
  deps: { db?: ClaimReaderDb } = {},
): Promise<ClaimValidation> {
  if (!token) return { valid: false, reason: 'invalid' };
  const db = deps.db ?? (prisma as unknown as ClaimReaderDb);
  const claim = await db.purchaseClaim.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });
  if (!claim) return { valid: false, reason: 'invalid' };
  if (claim.consumedAt) return { valid: false, reason: 'consumed' };
  if (claim.expiresAt.getTime() <= Date.now()) return { valid: false, reason: 'expired' };
  const subscription = await db.subscription.findUnique({
    where: { organizationId: claim.organizationId },
  });
  return {
    valid: true,
    claim: {
      email: claim.email,
      organizationId: claim.organizationId,
      organizationName: claim.organization?.name ?? null,
      plan: subscription?.plan ?? null,
      expiresAt: claim.expiresAt,
    },
  };
}

export type ClaimLinkDb = {
  user: {
    findUnique(args: {
      where: { email: string };
    }): Promise<{ id: string; clerkId: string } | null>;
  };
  purchaseClaim: {
    findFirst(args: {
      where: { userId: string; consumedAt: null };
    }): Promise<PurchaseClaimRow | null>;
  };
  $transaction<T>(fn: (tx: ClaimLinkTx) => Promise<T>): Promise<T>;
};

export type ClaimLinkTx = {
  user: {
    update(args: { where: { id: string }; data: { clerkId: string } }): Promise<unknown>;
  };
  purchaseClaim: {
    update(args: { where: { id: string }; data: { consumedAt: Date } }): Promise<unknown>;
  };
};

export type ClaimLinkOutcome = 'claimed' | 'none' | 'email-taken';

/**
 * Link a freshly created Clerk identity to its pending purchase tenant.
 * Called from the Clerk user.created webhook BEFORE the default
 * user+org+OWNER creation. Emails compare case-insensitively (our stored
 * copy is normalized lowercase; Clerk preserves input case).
 * - 'claimed': placeholder swapped + token consumed atomically. Caller must
 *   skip default provisioning.
 * - 'email-taken': address belongs to a real Clerk account. Caller must
 *   leave everything unchanged (dedicated existing-customer flow later).
 * - 'none': no pending tenant for this email. Caller proceeds normally.
 */
export async function linkPendingClaimToClerkUser(
  input: { clerkId: string; email: string },
  deps: { db?: ClaimLinkDb } = {},
): Promise<ClaimLinkOutcome> {
  const email = input.email.trim().toLowerCase();
  if (!input.clerkId || !email) return 'none';
  const db: ClaimLinkDb = deps.db ?? (prisma as unknown as ClaimLinkDb);

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return 'none';
  if (!user.clerkId.startsWith(PENDING_CLERK_ID_PREFIX)) return 'email-taken';

  const claim = await db.purchaseClaim.findFirst({
    where: { userId: user.id, consumedAt: null },
  });
  if (!claim) return 'none';
  if (claim.expiresAt.getTime() <= Date.now()) return 'none';
  if (claim.email.trim().toLowerCase() !== email) return 'none';

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { clerkId: input.clerkId } });
    await tx.purchaseClaim.update({ where: { id: claim.id }, data: { consumedAt: new Date() } });
  });
  return 'claimed';
}
