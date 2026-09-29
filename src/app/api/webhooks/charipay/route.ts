import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  CHARIPAY_PROVIDER,
  verifyChariPaySignature,
  parseChariPayEnvelope,
} from '@/features/billing/lib/charipay';
import {
  applyBillingEvent,
  type BillingEventResult,
  type BillingCoreDb,
} from '@/features/billing/lib/webhook-billing-core';

// ---------------------------------------------------------------------------
// ChariPay webhook receiver: verify → persist → delegate to the billing
// core (provision/renew/cancel/email). The core runs OUTSIDE the insert
// transaction (no external calls inside a tx) and is fully injectable for
// execution tests. Redeliveries converge: the insert dedups, provisioning
// converges on the deterministic placeholder, and the activation email is
// sent only while the event is still unprocessed. organizationId is NEVER
// invented — it is linked from the provisioned/renewed tenant.
// NOTE: /api/webhooks/* is intentionally public (see src/proxy.ts) —
// authenticity comes from the HMAC signature below, never from a session.
// ---------------------------------------------------------------------------

const MAX_WEBHOOK_BYTES = 1 * 1024 * 1024;

function isPrismaP2002(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002';
}

export async function POST(req: Request) {
  // Declared-length pre-gate (parity with the other webhook routes). The raw
  // body is still read fully below for signature verification.
  const declaredLength = Number(req.headers.get('content-length') || 0);
  if (declaredLength > MAX_WEBHOOK_BYTES) {
    return new Response('Request body too large', { status: 413 });
  }

  // Raw body FIRST — parsing before verification would break the HMAC.
  // Never logged: it may carry customer/payment data.
  const rawBody = await req.text();
  const secret = process.env.CHARIPAY_WEBHOOK_SECRET;
  const ok = verifyChariPaySignature({
    rawBody,
    signature: req.headers.get('X-CHARI-SIGNATURE'),
    timestamp: req.headers.get('X-CHARI-TIMESTAMP'),
    secret,
  });
  if (!ok) {
    return new Response('Invalid webhook signature', { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return new Response('Invalid JSON payload', { status: 400 });
  }

  const envelope = parseChariPayEnvelope({
    headerEventId: req.headers.get('Chari-Event-Id'),
    headerEventType: req.headers.get('Chari-Event-Type'),
    body,
  });
  if (!envelope) {
    return new Response('Invalid webhook envelope', { status: 400 });
  }
  const { eventType, providerEventId } = envelope;

  try {
    const duplicate = await prisma.$transaction(async (tx) => {
      // Deduplication is database-backed: the @@unique(provider,
      // providerEventId) constraint is authoritative. An existing row —
      // processed or not — means this delivery was already recorded.
      const existing = await tx.billingWebhookEvent.findUnique({
        where: { provider_providerEventId: { provider: CHARIPAY_PROVIDER, providerEventId } },
        select: { id: true, processedAt: true },
      });
      if (existing) return { duplicate: true as const, processed: existing.processedAt !== null };
      try {
        await tx.billingWebhookEvent.create({
          data: {
            provider: CHARIPAY_PROVIDER,
            providerEventId,
            eventType,
            payload: body as unknown as Prisma.InputJsonValue,
            organizationId: null,
          },
        });
      } catch (err: unknown) {
        // Concurrent duplicate delivery won the insert race.
        if (isPrismaP2002(err)) return { duplicate: true as const, processed: false };
        throw err;
      }
      return { duplicate: false as const, processed: false };
    });

    // Safe log: identifiers only — never the payload, never card data.
    console.info(
      `[charipay-webhook] stored event=${eventType} providerEventId=${providerEventId} duplicate=${duplicate.duplicate}`,
    );

    // Already fully processed (e.g. redelivery after success): no work,
    // and crucially no second activation email.
    if (duplicate.duplicate && duplicate.processed) {
      return Response.json({ received: true, duplicate: true });
    }

    return await processSucceededPayment(providerEventId, eventType, body);
  } catch {
    // Persistence failed — non-2xx so ChariPay retries; nothing was marked
    // processed and no business action ran, so the retry is fully safe.
    return new Response('Webhook processing failed', { status: 500 });
  }
}

/**
 * Single funnel for every stored-but-unfinished delivery: delegates to the
 * injectable billing core, then translates the outcome to HTTP.
 * Email failure is deliberately 2xx (never fail a good payment for a bad
 * mailbox): the tenant stays intact and the token-based resend path
 * recovers without a new payment.
 */
async function processSucceededPayment(
  providerEventId: string,
  eventType: string,
  body: unknown,
): Promise<Response> {
  const result: BillingEventResult = await applyBillingEvent(
    { providerEventId, eventType, body },
    { db: prisma as unknown as BillingCoreDb },
  );

  switch (result.outcome) {
    case 'duplicate':
      return Response.json({ received: true, duplicate: true });
    case 'conflict':
      // A concurrent redelivery is likely mid-flight: non-2xx so the
      // provider retries into a converged state. Nothing was marked.
      return new Response('Concurrent provisioning in progress', { status: 500 });
    case 'ignored':
      await markEvent(providerEventId, null);
      return Response.json({ received: true, duplicate: false });
    case 'unmapped':
    case 'ambiguous':
    case 'stale':
    case 'no-claim':
    case 'failed':
      await markEvent(providerEventId, null);
      return Response.json({ received: true, provisioned: false });
    case 'applied':
    case 'converged':
    case 'renewed':
    case 'status-updated':
      await markEvent(providerEventId, result.organizationId);
      return Response.json({ received: true, provisioned: true, emailSent: result.emailSent });
    case 'email-failed':
      await linkEventOrg(providerEventId, result.organizationId);
      return Response.json({ received: true, provisioned: true, emailSent: false });
  }
}

/** Mark fully handled (processed), optionally linking the tenant org. */
async function markEvent(providerEventId: string, organizationId: string | null): Promise<void> {
  await prisma.billingWebhookEvent.updateMany({
    where: { provider: CHARIPAY_PROVIDER, providerEventId, processedAt: null },
    data: { organizationId, processedAt: new Date() },
  });
}

/** Link the tenant org without marking processed (email still pending). */
async function linkEventOrg(providerEventId: string, organizationId: string | null): Promise<void> {
  await prisma.billingWebhookEvent.updateMany({
    where: { provider: CHARIPAY_PROVIDER, providerEventId, processedAt: null },
    data: { organizationId },
  });
}
