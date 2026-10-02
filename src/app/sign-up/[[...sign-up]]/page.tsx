import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { AuthLayout, authAppearance } from "@/features/auth";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Créer un compte",
  description: "Créez votre compte TUR et gérez votre activité de traiteur en toute simplicité.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${siteUrl}/sign-up`,
  },
};

/**
 * Self-registration is disabled: there is no public sign-in entry point
 * anywhere in the UI. This route only serves invitation/activation flows,
 * which always carry a token issued by our backend (see accept-invite).
 * Bare visits redirect to sign-in.
 *
 * Token gate (validity-based, NOT presence-based): the token is validated
 * server-side BEFORE the Clerk <SignUp> form is rendered.
 *   1. Missing token            → /sign-in
 *   2. Valid PurchaseClaim      → render, fallback /activate?token=...
 *   3. Valid team Invitation    → render, fallback /accept-invite?token=...
 *   4. Anything else (garbage, expired, consumed) → /sign-in
 *   5. Validator/database error → fail closed → /sign-in
 * A garbage token must NEVER render the real Clerk signup form.
 * Reuses getPurchaseClaimByToken (billing) and getInvitationByToken (team)
 * — no new token logic.
 *
 * NOTE: this is a route-level gate, not a Clerk instance restriction. True
 * enforcement additionally requires disabling sign-ups in the Clerk
 * dashboard; without that, the underlying Clerk endpoint still exists.
 */

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/sign-in");
  }

  // 1) Purchase activation token (paid SaaS claim).
  let purchaseValid = false;
  try {
    const { getPurchaseClaimByToken } = await import(
      "@/features/billing/lib/provisioning"
    );
    const purchase = await getPurchaseClaimByToken(token);
    purchaseValid = purchase.valid;
  } catch {
    purchaseValid = false;
  }

  if (purchaseValid) {
    return (
      <AuthLayout>
        <SignUp
          appearance={authAppearance}
          unsafeMetadata={{ traytioPurchaseToken: token }}
          fallbackRedirectUrl={`/activate?token=${encodeURIComponent(token)}`}
        />
      </AuthLayout>
    );
  }

  // 2) Team invitation token (custom application invitation).
  let invitationValid = false;
  try {
    const { getInvitationByToken } = await import(
      "@/features/team/actions/get-invitation-by-token"
    );
    const invitation = await getInvitationByToken(token);
    invitationValid = invitation.success === true;
  } catch {
    invitationValid = false;
  }

  if (invitationValid) {
    return (
      <AuthLayout>
        <SignUp
          appearance={authAppearance}
          fallbackRedirectUrl={`/accept-invite?token=${encodeURIComponent(token)}`}
        />
      </AuthLayout>
    );
  }

  // 3) Unknown / expired / consumed token — fail closed.
  redirect("/sign-in");
}
