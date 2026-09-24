import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  CHARIPAY_PROVIDER,
  verifyChariPaySignature,
  parseChariPayEnvelope,
  extractChariPayPaymentDetails,
} from '@/features/billing/lib/charipay';
import { resolvePlan } from '@/features/billing/lib/plans';
import { provisionSaaSCustomer } from '@/features/billing/lib/provisioning';
import { sendSaaSActivationEmail } from '@/features/billing/lib/activation-email';

// ---------------------------------------------------------------------------
// ChariPay webhook receiver: verify → persist → (payment.succeeded only)
// provision → email. Provisioning and email run OUTSIDE the insert
// transaction (no external calls inside a tx). Redeliveries converge:
// the insert dedups, provisioning converges on the deterministic placeholder,
// and the activation email is sent only while the event is still
// unprocessed. organizationId is NEVER invented — it is linked from the
// provisioned tenant. No User/Organization/Subscription is created for any
// other event type.
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

    // Only successful payments provision. Failures and unknown types stay
    // persisted-only (marked processed: nothing further to do).
    if (eventType !== 'payment.succeeded') {
      await prisma.billingWebhookEvent.updateMany({
        where: { provider: CHARIPAY_PROVIDER, providerEventId, processedAt: null },
        data: { processedAt: new Date() },
      });
      return Response.json({ received: true, duplicate: duplicate.duplicate });
    }

    // Already fully processed (e.g. redelivery after success): no work,
    // and crucially no second activation email.
    if (duplicate.duplicate && duplicate.processed) {
      return Response.json({ received: true, duplicate: true });
    }

    return await processSucceededPayment(providerEventId, body);
  } catch {
    // Persistence failed — non-2xx so ChariPay retries; nothing was marked
    // processed and no business action ran, so the retry is fully safe.
    return new Response('Webhook processing failed', { status: 500 });
  }
}

/**
 * Map a payment.succeeded payload through provisioning + activation email.
 * Runs fully outside any DB transaction. Returns 2xx only when the tenant
 * is provisioned, the email is sent, and the event is linked + marked.
 * Email failure leaves the tenant intact and the event unprocessed so a
 * ChariPay retry converges idempotently and re-attempts the email.
 */
async function processSucceededPayment(providerEventId: string, body: unknown): Promise<Response> {
  const details = extractChariPayPaymentDetails(body);
  const metadata = details?.metadata ?? null;
  const plan = resolvePlan(
    typeof metadata?.plan === 'string' ? metadata.plan : undefined,
  );

  const fail = async (reason: string) => {
    // Unmappable events (e.g. pre-metadata sessions): stored dead-end, marked
    // processed so retries don't loop forever. Nothing is provisioned.
    console.warn(`[charipay-webhook] unprovisionable ${providerEventId}: ${reason}`);
    await prisma.billingWebhookEvent.updateMany({
      where: { provider: CHARIPAY_PROVIDER, providerEventId, processedAt: null },
      data: { processedAt: new Date() },
    });
    return Response.json({ received: true, provisioned: false });
  };

  if (!details || !metadata || !plan) return fail('missing reference/metadata/plan');
  if (details.amount !== null && details.amount !== plan.priceMad) {
    return fail(`amount mismatch (paid ${details.amount}, plan ${plan.priceMad})`);
  }

  const customer = {
    firstName: metadata.firstName,
    lastName: metadata.lastName,
    email: metadata.email,
    phone: metadata.phone,
  };
  const provisioned = await provisionSaaSCustomer({
    provider: CHARIPAY_PROVIDER,
    providerReference: details.reference,
    plan: plan.id,
    customer,
  });
  if (!provisioned.success) {
    // Validation-level failure (bad customer data): dead-end like unmapped.
    // Tenant-level conflicts converge inside provisionSaaSCustomer.
    return fail('provisioning validation failed');
  }

  // Re-read the event gate AFTER provisioning: a concurrent duplicate may
  // have completed (and emailed) while we worked — then skip the email.
  const gate = await prisma.billingWebhookEvent.findUnique({
    where: { provider_providerEventId: { provider: CHARIPAY_PROVIDER, providerEventId } },
    select: { processedAt: true },
  });
  if (gate?.processedAt) {
    return Response.json({ received: true, duplicate: true });
  }

  // Resolve the claim token for the activation email (works for fresh and
  // converged replays alike).
  const claim = await prisma.purchaseClaim.findFirst({
    where: { userId: provisioned.userId, consumedAt: null },
    select: { token: true },
  });
  if (!claim) return fail('no claim available for activation email');

  const mailed = await sendSaaSActivationEmail({
    to: provisionedCustomerEmail(customer),
    firstName: typeof customer.firstName === 'string' ? customer.firstName : '',
    plan: plan.id,
    token: claim.token,
  });
  if (!mailed.success) {
    // Tenant + claim stay intact, event stays unprocessed: a ChariPay retry
    // converges provisioning and re-attempts exactly this email.
    console.error(`[charipay-webhook] activation email failed for ${providerEventId}`);
    return new Response('Activation email failed', { status: 500 });
  }

  await prisma.billingWebhookEvent.updateMany({
    where: { provider: CHARIPAY_PROVIDER, providerEventId, processedAt: null },
    data: { organizationId: provisioned.organizationId || null, processedAt: new Date() },
  });
  console.info(`[charipay-webhook] provisioned org for ${providerEventId}`);
  return Response.json({ received: true, provisioned: true });
}

function provisionedCustomerEmail(customer: Record<string, unknown>): string {
  return typeof customer.email === 'string' ? customer.email : '';
}
