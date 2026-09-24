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
 * which always carry the team-invitation token issued by our backend
 * (see accept-invite). Bare visits redirect to sign-in.
 *
 * Paid SaaS customers use a purchase-scoped token instead (Phase 3A):
 * a valid, unconsumed purchase claim redirects signup completion to the
 * activation page. Team-invitation behavior is unchanged for all other
 * tokens.
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

  // Purchase-scoped signup: only when the token is a live purchase claim.
  // Everything else (team tokens, unknown tokens) keeps the legacy fallback.
  const { getPurchaseClaimByToken } = await import("@/features/billing/lib/provisioning");
  const purchase = await getPurchaseClaimByToken(token).catch(() => null);
  const fallbackRedirectUrl =
    purchase && purchase.valid
      ? `/activate?token=${encodeURIComponent(token)}`
      : `/accept-invite?token=${encodeURIComponent(token)}`;

  return (
    <AuthLayout>
      <SignUp appearance={authAppearance} fallbackRedirectUrl={fallbackRedirectUrl} />
    </AuthLayout>
  );
}
