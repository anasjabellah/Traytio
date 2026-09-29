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

export type ResendClaimDb = {
  purchaseClaim: {
    findUnique(args: { where: { token: string } }): Promise<{
      email: string;
      userId: string;
      consumedAt: Date | null;
      expiresAt: Date;
    } | null>;
  };
  user: {
    findUnique(args: { where: { id: string } }): Promise<{ firstName: string | null } | null>;
  };
  subscription: {
    findFirst(args: { where: { organizationId: string } }): Promise<{ plan: string } | null>;
  };
  userOrganization: {
    findMany(args: { where: { userId: string } }): Promise<{ organizationId: string }[]>;
  };
};

export type ResendActivationResult =
  | { success: true }
  | { success: false; error: 'invalid' | 'expired' | 'consumed' | 'email' };

/**
 * Re-send the activation email for a valid, unconsumed purchase claim.
 * Token-bearer authorized (the token IS the credential — same trust as the
 * activation link itself). Never invents recipient/plan: everything comes
 * from stored rows. Returns 'invalid' for unknown tokens so callers can
 * answer 404 without distinguishing reasons to strangers.
 */
export async function resendClaimActivationEmail(
  token: string,
  deps: { db: ResendClaimDb; mailer?: ResendClientLike; clock?: () => Date },
): Promise<ResendActivationResult> {
  if (!token || typeof token !== 'string') return { success: false, error: 'invalid' };
  const now = deps.clock ? deps.clock() : new Date();
  const claim = await deps.db.purchaseClaim.findUnique({ where: { token } });
  if (!claim) return { success: false, error: 'invalid' };
  if (claim.consumedAt) return { success: false, error: 'consumed' };
  if (claim.expiresAt.getTime() <= now.getTime()) return { success: false, error: 'expired' };

  const [user, memberships] = await Promise.all([
    deps.db.user.findUnique({ where: { id: claim.userId } }),
    deps.db.userOrganization.findMany({ where: { userId: claim.userId } }),
  ]);
  const organizationId = memberships.length === 1 && memberships[0] ? memberships[0].organizationId : null;
  const subscription = organizationId
    ? await deps.db.subscription.findFirst({ where: { organizationId } })
    : null;

  const mailed = await sendSaaSActivationEmail(
    {
      to: claim.email,
      firstName: user?.firstName ?? '',
      plan: subscription?.plan ?? 'STARTER',
      token,
    },
    deps.mailer ? { client: deps.mailer } : {},
  );
  if (!mailed.success) return { success: false, error: 'email' };
  return { success: true };
}

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
