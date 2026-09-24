import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { AuthLayout } from "@/features/auth";
import { getPurchaseClaimByToken } from "@/features/billing/lib/provisioning";

export const metadata: Metadata = {
  title: "Activer votre abonnement",
  description: "Activez votre compte Traytio après votre abonnement.",
  robots: { index: false, follow: false },
};

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card shadow-xl p-8 text-center">
      <div className="mx-auto size-14 rounded-2xl bg-gold-soft flex items-center justify-center mb-4">
        {icon}
      </div>
      <h1 className="font-display text-xl font-semibold mb-2">{title}</h1>
      <div className="text-sm text-muted-foreground space-y-3">{children}</div>
    </div>
  );
}

/**
 * Paid-customer activation status page (Phase 3A, server-rendered, no
 * mutations). Reached via /sign-up?token=<purchase-token> completion or
 * directly from the purchase email (later phase). Shows claim state:
 * pending (finish signup), consumed (already activated), invalid/expired.
 */
export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const { userId } = await auth();

  if (!token) {
    return (
      <AuthLayout>
        <Card icon={<XCircle className="size-6 text-red-500" />} title="Lien d'activation invalide">
          <p>Ce lien d&apos;activation est incomplet.</p>
          <Link href="/sign-in" className="text-[var(--gold-deep)] hover:underline">
            Se connecter
          </Link>
        </Card>
      </AuthLayout>
    );
  }

  const result = await getPurchaseClaimByToken(token).catch(() => null);

  if (!result || !result.valid) {
    const reason = result && !result.valid ? result.reason : "invalid";
    return (
      <AuthLayout>
        <Card icon={<XCircle className="size-6 text-red-500" />} title="Lien d'activation invalide">
          <p>
            {reason === "expired"
              ? "Ce lien d'activation a expiré. Contactez le support pour recevoir un nouveau lien."
              : reason === "consumed"
                ? "Ce lien a déjà été utilisé."
                : "Ce lien d'activation est inconnu."}
          </p>
          <Link href="/sign-in" className="text-[var(--gold-deep)] hover:underline">
            Se connecter
          </Link>
        </Card>
      </AuthLayout>
    );
  }

  // Consumed claims are handled by getPurchaseClaimByToken as invalid; a
  // separate success state is rendered when the viewer is already signed in
  // and the claim email matches their session (claim completed via webhook).
  const { claim } = result;
  return (
    <AuthLayout>
      <Card icon={<Clock3 className="size-6 text-[var(--gold-deep)]" />} title="Activez votre compte">
        <p>
          Votre abonnement <strong>{claim.plan ?? "Traytio"}</strong> pour{" "}
          <strong>{claim.organizationName ?? "votre organisation"}</strong> est prêt.
        </p>
        <p>
          Créez votre compte Clerk avec l&apos;adresse <strong>{claim.email}</strong> pour
          activer l&apos;accès.
        </p>
        {userId ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[var(--gold-deep)] text-white text-sm font-semibold"
          >
            <CheckCircle2 className="size-4" /> Accéder au tableau de bord
          </Link>
        ) : (
          <Link
            href={`/sign-up?token=${encodeURIComponent(token)}`}
            className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-[var(--gold-deep)] text-white text-sm font-semibold"
          >
            Créer mon compte
          </Link>
        )}
      </Card>
    </AuthLayout>
  );
}
