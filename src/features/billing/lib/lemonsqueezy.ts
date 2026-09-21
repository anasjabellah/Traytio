import crypto from 'node:crypto';
import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Lemon Squeezy provider layer (TEST MODE only).
//
// No SDK dependency: the integration needs exactly two HTTP calls (create
// checkout, retrieve subscription), so raw fetch against the documented
// JSON:API endpoints is cleaner than a third-party package. Everything
// Lemon-Squeezy-specific (payload shapes, status vocabulary, variant
// mapping) lives in this file — generic billing logic stays in billing.ts.
// Docs: https://docs.lemonsqueezy.com/api
// ---------------------------------------------------------------------------

export const LEMON_SQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1';
export const LEMON_SQUEEZY_PROVIDER = 'lemonsqueezy';

export type BillingPlan = Extract<SubscriptionPlan, 'STARTER' | 'PROFESSIONAL'>;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function lemonSqueezyConfig() {
  return {
    apiKey: requiredEnv('LEMON_SQUEEZY_API_KEY'),
    storeId: requiredEnv('LEMON_SQUEEZY_STORE_ID'),
    webhookSecret: requiredEnv('LEMON_SQUEEZY_WEBHOOK_SECRET'),
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  };
}

/** Server-side plan → variant mapping. Client input can only ever be a plan. */
export function variantIdForPlan(plan: BillingPlan): string {
  if (plan === 'STARTER') return requiredEnv('LEMON_SQUEEZY_STARTER_VARIANT_ID');
  return requiredEnv('LEMON_SQUEEZY_PROFESSIONAL_VARIANT_ID');
}

/** Variant → plan. Returns null for unknown variants (never guess). */
export function planForVariantId(variantId: string | number | null | undefined): BillingPlan | null {
  if (variantId === null || variantId === undefined) return null;
  const id = String(variantId);
  // Env access is lazy so pure mapping stays testable without credentials.
  if (process.env.LEMON_SQUEEZY_STARTER_VARIANT_ID && id === process.env.LEMON_SQUEEZY_STARTER_VARIANT_ID) {
    return 'STARTER';
  }
  if (process.env.LEMON_SQUEEZY_PROFESSIONAL_VARIANT_ID && id === process.env.LEMON_SQUEEZY_PROFESSIONAL_VARIANT_ID) {
    return 'PROFESSIONAL';
  }
  return null;
}

/** Lemon Squeezy subscription status → Traytio status. Null = do not apply. */
export function mapSubscriptionStatus(status: string | null | undefined): SubscriptionStatus | null {
  switch (status) {
    case 'on_trial':
      return 'TRIALING';
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'unpaid':
      return 'UNPAID';
    case 'cancelled':
      return 'CANCELED';
    // Ended subscriptions carry no access; CANCELED is the terminal
    // no-access state in our enum (see billing.ts semantics).
    case 'expired':
      return 'CANCELED';
    // `paused` and anything unknown: deliberately unmapped — the caller
    // stores the event and leaves the Subscription row untouched.
    default:
      return null;
  }
}

export type LemonSqueezySubscriptionAttributes = {
  store_id?: number;
  customer_id?: number;
  variant_id?: number;
  status?: string;
  cancelled?: boolean;
  trial_ends_at?: string | null;
  renews_at?: string | null;
  ends_at?: string | null;
  test_mode?: boolean;
  urls?: { customer_portal?: string | null } | null;
  first_subscription_item?: { price_id?: number } | null;
};

export type LemonSqueezySubscriptionData = {
  id: string;
  attributes: LemonSqueezySubscriptionAttributes;
};

/** Idempotency key: exact redeliveries share updated_at; distinct updates differ. */
export function webhookEventKey(eventName: string, data: { type: string; id: string; attributes?: { updated_at?: string } }): string {
  return `${eventName}:${data.type}:${data.id}:${data.attributes?.updated_at ?? 'no-ts'}`;
}

function lemonSqueezyHeaders(apiKey: string): Record<string, string> {
  return {
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    Authorization: `Bearer ${apiKey}`,
  };
}

/**
 * Create a hosted checkout (TEST MODE enforced) bound to an organization via
 * checkout custom data. Returns the hosted checkout URL for redirect.
 */
export async function createLemonSqueezyCheckout(input: {
  variantId: string;
  organizationId: string;
  customerEmail?: string | null;
  customerName?: string | null;
}): Promise<{ checkoutUrl: string; checkoutId: string }> {
  const { apiKey, storeId, appUrl } = lemonSqueezyConfig();

  const res = await fetch(`${LEMON_SQUEEZY_API_BASE}/checkouts`, {
    method: 'POST',
    headers: lemonSqueezyHeaders(apiKey),
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          test_mode: true,
          product_options: { enabled_variants: [Number(input.variantId)], redirect_url: `${appUrl}/dashboard` },
          checkout_options: { embed: false, media: true, logo: true, desc: true, discount: true },
          checkout_data: {
            email: input.customerEmail ?? undefined,
            name: input.customerName ?? undefined,
            custom: { organization_id: input.organizationId },
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: String(storeId) } },
          variant: { data: { type: 'variants', id: String(input.variantId) } },
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Lemon Squeezy checkout creation failed (HTTP ${res.status})`);
  }

  const json = (await res.json()) as {
    data?: { id?: string; attributes?: { url?: string } };
    errors?: Array<{ detail?: string }>;
  };
  const checkoutUrl = json.data?.attributes?.url;
  const checkoutId = json.data?.id;
  if (!checkoutUrl || !checkoutId) {
    throw new Error(json.errors?.[0]?.detail ?? 'Lemon Squeezy returned no checkout URL');
  }
  return { checkoutUrl, checkoutId };
}

/** Retrieve a subscription (used for the customer portal URL). */
export async function retrieveLemonSqueezySubscription(
  providerSubscriptionId: string,
): Promise<LemonSqueezySubscriptionData> {
  const { apiKey } = lemonSqueezyConfig();
  const res = await fetch(
    `${LEMON_SQUEEZY_API_BASE}/subscriptions/${encodeURIComponent(providerSubscriptionId)}`,
    { headers: { Accept: 'application/vnd.api+json', Authorization: `Bearer ${apiKey}` } },
  );
  if (!res.ok) {
    throw new Error(`Lemon Squeezy subscription fetch failed (HTTP ${res.status})`);
  }
  const json = (await res.json()) as { data?: LemonSqueezySubscriptionData };
  if (!json.data) throw new Error('Lemon Squeezy returned no subscription');
  return json.data;
}

/**
 * Verify a webhook request per the official signing scheme: HMAC-SHA256 hex
 * of the RAW body compared with timingSafeEqual against X-Signature.
 * Docs: https://docs.lemonsqueezy.com/help/webhooks/signing-requests
 */
export function verifyLemonSqueezySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;
  const digest = Buffer.from(crypto.createHmac('sha256', secret).update(rawBody).digest('hex'), 'utf8');
  const given = Buffer.from(signature, 'utf8');
  if (digest.length !== given.length) return false;
  return crypto.timingSafeEqual(digest, given);
}
