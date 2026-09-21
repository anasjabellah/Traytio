import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  LEMON_SQUEEZY_PROVIDER,
  mapSubscriptionStatus,
  planForVariantId,
  verifyLemonSqueezySignature,
  webhookEventKey,
} from '@/features/billing/lib/lemonsqueezy';

// NOTE: /api/webhooks/* is intentionally public (see src/proxy.ts) —
// authenticity comes from the HMAC signature below, never from a session.
// This route never trusts organization/customer/subscription identifiers
// except those Lemon Squeezy echoes back from OUR OWN server-generated
// checkout custom data (inside a signature-verified payload).

const HANDLED_SUBSCRIPTION_EVENTS = new Set([
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_resumed',
  'subscription_expired',
]);

const MAX_WEBHOOK_BYTES = 1 * 1024 * 1024;

function isPrismaP2002(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002';
}

function toDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

type WebhookEnvelope = {
  meta?: { event_name?: unknown; custom_data?: Record<string, unknown> | null };
  data?: {
    type?: unknown;
    id?: unknown;
    attributes?: {
      updated_at?: unknown;
      status?: unknown;
      variant_id?: unknown;
      customer_id?: unknown;
      cancelled?: unknown;
      trial_ends_at?: unknown;
      renews_at?: unknown;
      ends_at?: unknown;
      created_at?: unknown;
      first_subscription_item?: { price_id?: unknown } | null;
    };
  };
};

function asString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export async function POST(req: Request) {
  // Declared-length pre-gate (parity with the Clerk webhook). The raw body
  // is still read fully below for signature verification.
  const declaredLength = Number(req.headers.get('content-length') || 0);
  if (declaredLength > MAX_WEBHOOK_BYTES) {
    return new Response('Request body too large', { status: 413 });
  }

  // Raw body FIRST — parsing before verification would break the HMAC.
  const rawBody = await req.text();
  if (!verifyLemonSqueezySignature(rawBody, req.headers.get('X-Signature'))) {
    return new Response('Invalid webhook signature', { status: 400 });
  }

  let body: WebhookEnvelope;
  try {
    body = JSON.parse(rawBody) as WebhookEnvelope;
  } catch {
    return new Response('Invalid JSON payload', { status: 400 });
  }

  const eventName = body?.meta?.event_name;
  const data = body?.data;
  if (
    typeof eventName !== 'string' ||
    !eventName ||
    !data ||
    typeof data.type !== 'string' ||
    typeof data.id !== 'string' ||
    !data.id
  ) {
    return new Response('Invalid webhook envelope', { status: 400 });
  }

  const providerEventId = webhookEventKey(eventName, {
    type: data.type,
    id: data.id,
    attributes: { updated_at: asString(data.attributes?.updated_at) ?? undefined },
  });

  // Narrowed once here — property narrowing does not survive into the
  // transaction closure below, so freeze the validated scalars.
  const objectType: string = data.type;
  const objectId: string = data.id;
  const attributes = data.attributes ?? {};
  const customData = body.meta?.custom_data;

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      // Idempotency gate: an already-PROCESSED delivery is a no-op. A stored
      // but unprocessed row means a previous attempt failed mid-apply, so we
      // fall through and re-apply (the upsert below is naturally idempotent).
      const existing = await tx.billingWebhookEvent.findUnique({
        where: {
          provider_providerEventId: { provider: LEMON_SQUEEZY_PROVIDER, providerEventId },
        },
        select: { id: true, processedAt: true },
      });
      if (existing?.processedAt) {
        return { applied: false as const, reason: 'duplicate' as const };
      }

      // Resolve the Traytio organization. Order matters:
      // 1. custom_data.organization_id echoed from OUR server-generated
      //    checkout (verified org must exist).
      // 2. Fallback: an existing Subscription row for this provider id
      //    (covers events for subs created before custom data existed).
      // Anything else: store the event, apply nothing.
      let organizationId: string | null = null;
      const customOrgId = customData?.organization_id;
      if (typeof customOrgId === 'string' && customOrgId) {
        const org = await tx.organization.findUnique({
          where: { id: customOrgId },
          select: { id: true },
        });
        if (org) organizationId = org.id;
        else {
          console.warn(
            `[lemonsqueezy-webhook] unknown organization_id in custom_data for event ${eventName}; storing without apply`,
          );
        }
      }
      if (!organizationId && objectType === 'subscriptions') {
        const known = await tx.subscription.findUnique({
          where: { providerSubscriptionId: objectId },
          select: { organizationId: true },
        });
        if (known) organizationId = known.organizationId;
      }

      if (!existing) {
        try {
          await tx.billingWebhookEvent.create({
            data: {
              provider: LEMON_SQUEEZY_PROVIDER,
              providerEventId,
              eventType: eventName,
              payload: body as unknown as Prisma.InputJsonValue,
              organizationId,
            },
          });
        } catch (err: unknown) {
          // Concurrent identical delivery won the insert race.
          if (isPrismaP2002(err)) return { applied: false as const, reason: 'duplicate' as const };
          throw err;
        }
      }

      // Non-subscription events (order_created, payment_*, ...) are stored
      // for audit but never touch the Subscription row.
      if (!HANDLED_SUBSCRIPTION_EVENTS.has(eventName) || objectType !== 'subscriptions') {
        await tx.billingWebhookEvent.updateMany({
          where: { provider: LEMON_SQUEEZY_PROVIDER, providerEventId },
          data: { processedAt: new Date() },
        });
        return { applied: false as const, reason: 'stored-only' as const };
      }

      if (!organizationId) {
        console.warn(
          `[lemonsqueezy-webhook] cannot attribute ${eventName} for provider subscription ${objectId}; stored without apply`,
        );
        await tx.billingWebhookEvent.updateMany({
          where: { provider: LEMON_SQUEEZY_PROVIDER, providerEventId },
          data: { processedAt: new Date() },
        });
        return { applied: false as const, reason: 'unattributed' as const };
      }

      const attrs = attributes;
      const status = mapSubscriptionStatus(asString(attrs.status));
      const plan = planForVariantId(asNumber(attrs.variant_id));
      if (!status || !plan) {
        console.warn(
          `[lemonsqueezy-webhook] unmappable ${eventName} (status=${String(attrs.status)} variant=${String(attrs.variant_id)}); stored without apply`,
        );
        await tx.billingWebhookEvent.updateMany({
          where: { provider: LEMON_SQUEEZY_PROVIDER, providerEventId },
          data: { processedAt: new Date() },
        });
        return { applied: false as const, reason: 'unmapped' as const };
      }

      // Cross-organization guard: this provider subscription must never
      // rewrite another organization's row.
      const clash = await tx.subscription.findUnique({
        where: { providerSubscriptionId: objectId },
        select: { organizationId: true },
      });
      if (clash && clash.organizationId !== organizationId) {
        console.warn(
          `[lemonsqueezy-webhook] provider subscription ${objectId} already belongs to another organization; refusing to rewrite`,
        );
        await tx.billingWebhookEvent.updateMany({
          where: { provider: LEMON_SQUEEZY_PROVIDER, providerEventId },
          data: { processedAt: new Date() },
        });
        return { applied: false as const, reason: 'cross-org-blocked' as const };
      }

      const existingSub = await tx.subscription.findUnique({
        where: { organizationId },
        select: { currentPeriodStart: true },
      });
      const item = attrs.first_subscription_item;
      const itemPriceId = item && typeof item === 'object' ? asNumber(item.price_id) : null;
      const isCreatedEvent = eventName === 'subscription_created';
      const customerId = asNumber(attrs.customer_id);
      const createdAt = asString(attrs.created_at);

      await tx.subscription.upsert({
        where: { organizationId },
        create: {
          organizationId,
          provider: LEMON_SQUEEZY_PROVIDER,
          providerCustomerId: customerId !== null ? String(customerId) : null,
          providerSubscriptionId: objectId,
          plan,
          status,
          priceId: itemPriceId !== null ? String(itemPriceId) : null,
          // First cycle starts at provider creation; later events must not
          // backfill a wrong start.
          currentPeriodStart: toDate(createdAt),
          currentPeriodEnd: toDate(asString(attrs.renews_at)),
          trialEnd: toDate(asString(attrs.trial_ends_at)),
          cancelAtPeriodEnd: attrs.cancelled === true,
        },
        update: {
          provider: LEMON_SQUEEZY_PROVIDER,
          providerCustomerId: customerId !== null ? String(customerId) : null,
          providerSubscriptionId: objectId,
          plan,
          status,
          priceId: itemPriceId !== null ? String(itemPriceId) : null,
          currentPeriodStart:
            existingSub?.currentPeriodStart ?? (isCreatedEvent ? toDate(createdAt) : null),
          currentPeriodEnd: toDate(asString(attrs.renews_at)),
          trialEnd: toDate(asString(attrs.trial_ends_at)),
          cancelAtPeriodEnd: attrs.cancelled === true,
        },
      });

      await tx.billingWebhookEvent.updateMany({
        where: { provider: LEMON_SQUEEZY_PROVIDER, providerEventId },
        data: { processedAt: new Date() },
      });
      return { applied: true as const, reason: 'applied' as const };
    });

    return Response.json({ received: true, ...outcome });
  } catch (err: unknown) {
    if (isPrismaP2002(err)) {
      // Lost an insert race under concurrency — the other delivery owns it.
      return Response.json({ received: true, applied: false, reason: 'duplicate' });
    }
    console.error(
      `[lemonsqueezy-webhook] apply failed for event ${eventName}:`,
      err instanceof Error ? err.message : 'unknown error',
    );
    // Non-2xx so Lemon Squeezy retries; the stored (unprocessed) row makes
    // the retry re-apply idempotently.
    return new Response('Webhook processing failed', { status: 500 });
  }
}
