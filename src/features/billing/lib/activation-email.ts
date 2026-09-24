import { buildSaasActivationEmailHtml } from '@/emails/saas-activation-email';
import { PURCHASE_TOKEN_TTL_MS } from '@/features/billing/lib/provisioning';

// NOTE: @/lib/resend is imported lazily inside the sender (never at module
// top level): constructing its singleton throws when RESEND_API_KEY is
// unset, which would break any importer (including tests injecting a fake
// client) in environments without mail credentials.

// ---------------------------------------------------------------------------
// SaaS activation email sender (Phase 3B) — server-side only.
// Standalone function for Phase 4 (post-webhook provisioning) to call AFTER
// its database transaction commits. Never called from inside a transaction:
// on Resend failure the tenant + PurchaseClaim stay intact and valid, so the
// email can simply be retried later. Returns a controlled result, never
// throws for delivery failures. Only the recipient address is ever logged —
// never the token, the URL, or any secret.
// ---------------------------------------------------------------------------

export type ResendClientLike = {
  emails: {
    send(args: { from: string; to: string; subject: string; html: string }): Promise<{
      error: unknown;
      data?: unknown;
    }>;
  };
};

export type SaasActivationEmailResult = { success: true } | { success: false; error: string };

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export function buildActivationUrl(token: string): string {
  return `${appUrl()}/sign-up?token=${encodeURIComponent(token)}`;
}

export async function sendSaaSActivationEmail(
  input: {
    to: string;
    firstName: string;
    plan: string;
    token: string;
  },
  deps: { client?: ResendClientLike; nowMs?: number } = {},
): Promise<SaasActivationEmailResult> {
  const to = input.to.trim();
  if (!to) return { success: false, error: 'Adresse email requise.' };

  const client: ResendClientLike = deps.client ?? (await import('@/lib/resend')).resend;
  const resendFromEmail: string = deps.client
    ? 'TUR <activation@traytio.test>'
    : (await import('@/lib/resend')).resendFromEmail;
  const expiresAt = new Date((deps.nowMs ?? Date.now()) + PURCHASE_TOKEN_TTL_MS);
  const html = buildSaasActivationEmailHtml({
    firstName: input.firstName.trim() || 'Bienvenue',
    plan: input.plan,
    activationUrl: buildActivationUrl(input.token),
    expiresAt,
  });

  let result: { error: unknown };
  try {
    result = await client.emails.send({
      from: `TUR <${resendFromEmail}>`,
      to,
      subject: 'Activez votre compte TUR',
      html,
    });
  } catch {
    console.error('[saas-activation-email] send failed for recipient:', to);
    return { success: false, error: 'Envoi impossible pour le moment.' };
  }

  if (result.error) {
    console.error('[saas-activation-email] provider error for recipient:', to);
    return { success: false, error: 'Envoi impossible pour le moment.' };
  }
  return { success: true };
}
