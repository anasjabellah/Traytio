import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { CreditCard, CheckCircle2, AlertTriangle } from "lucide-react";
import { AuthLayout } from "@/features/auth";
import {
  getOrganizationSubscription,
  isEntitledStatus,
} from "@/features/billing/lib/billing";
import { getCurrentMembership } from "@/lib/assert-role";
import { cancelSubscription } from "@/features/billing/actions/cancel-subscription";

export const metadata: Metadata = {
  title: "Facturation",
  description: "Gérez votre abonnement Traytio.",
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  TRIALING: "Essai",
  INCOMPLETE: "En attente de paiement",
  PAST_DUE: "Paiement en retard",
  CANCELED: "Résilié",
  INCOMPLETE_EXPIRED: "Expiré",
  UNPAID: "Impayé",
};

/**
 * Billing escape hatch (P0). Deliberately OUTSIDE the dashboard layout so
 * organizations without an active subscription can always reach it — it is
 * where inactive orgs land (dashboard redirects here) to subscribe.
 * Read-only: shows status + plan and links to checkout. Never gates itself
 * on entitlement (that would be a redirect loop).
 */
export default async function BillingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let membership: { organizationId: string; role: string } | null = null;
  try {
    membership = await getCurrentMembership();
  } catch {
    membership = null;
  }

  if (!membership) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card shadow-xl p-8 text-center">
          <div className="mx-auto size-14 rounded-2xl bg-gold-soft flex items-center justify-center mb-4">
            <AlertTriangle className="size-6 text-amber-600" />
          </div>
          <h1 className="font-display text-xl font-semibold mb-2">Aucune organisation</h1>
          <p className="text-sm text-muted-foreground">
            Votre compte n&apos;est rattaché à aucune organisation pour le moment. Si vous venez
            de vous inscrire, patientez quelques instants puis actualisez la page.
          </p>
        </div>
      </AuthLayout>
    );
  }

  const subscription = await getOrganizationSubscription().catch(() => null);
  const entitled = isEntitledStatus(subscription?.status ?? null);

  return (
    <AuthLayout>
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card shadow-xl p-8 text-center">
        <div className="mx-auto size-14 rounded-2xl bg-gold-soft flex items-center justify-center mb-4">
          {entitled ? (
            <CheckCircle2 className="size-6 text-emerald-600" />
          ) : (
            <CreditCard className="size-6 text-[var(--gold-deep)]" />
          )}
        </div>
        <h1 className="font-display text-xl font-semibold mb-2">Facturation</h1>
        <p className="text-sm text-muted-foreground">
          Statut de l&apos;abonnement :{' '}
          <strong>
            {subscription ? (STATUS_LABELS[subscription.status] ?? subscription.status) : 'Aucun abonnement'}
          </strong>
          {subscription ? ` — Formule ${subscription.plan}` : null}
        </p>

        {entitled ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Votre abonnement est actif. Vous pouvez accéder à votre espace.
            </p>
            {subscription?.currentPeriodEnd && (
              <p className="text-xs text-muted-foreground">
                Renouvellement le {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')} — {subscription.plan} via {subscription.provider}
              </p>
            )}
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-[var(--gold-deep)] text-white text-sm font-semibold"
            >
              Accéder au tableau de bord
            </Link>
            {membership.role === 'OWNER' && subscription?.status === 'ACTIVE' && (
              <form
                action={async () => {
                  'use server';
                  await cancelSubscription();
                }}
              >
                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center h-10 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-secondary/40"
                >
                  Résilier l&apos;abonnement
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Un abonnement actif est nécessaire pour utiliser Traytio. Choisissez une formule
              pour activer votre espace.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/checkout?plan=STARTER"
                className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-[var(--gold-deep)] text-white text-sm font-semibold"
              >
                Choisir Starter — 299 MAD/mois
              </Link>
              <Link
                href="/checkout?plan=PROFESSIONAL"
                className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-border text-sm font-semibold hover:bg-secondary/40"
              >
                Choisir Professionnel — 599 MAD/mois
              </Link>
            </div>
            <Link href="/tarifs" className="inline-block text-xs text-muted-foreground hover:underline">
              Voir toutes les formules
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
