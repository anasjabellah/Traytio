import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/site/Navbar';
import { Footer } from '@/components/site/Footer';
import { resolvePlan } from '@/features/billing/lib/plans';
import { CheckoutForm } from './checkout-form';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Finalisez votre abonnement Traytio.',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  // Only the plan identifier is read from the URL. Pricing always resolves
  // server-side — ?plan=STARTER&amount=1 cannot alter the total.
  const { plan: planParam } = await searchParams;
  const plan = resolvePlan(planParam);
  if (!plan) notFound();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface-soft text-foreground">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-12 lg:pt-28 lg:pb-16">
          <Link
            href="/tarifs"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Retour aux tarifs
          </Link>

          <h1 className="mt-4 font-display text-4xl lg:text-5xl tracking-tight">
            Finaliser votre abonnement
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-gold-deep" />
            Page sécurisée — aucun compte requis pour continuer.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <section
              aria-label="Détails du plan"
              className="h-fit rounded-3xl bg-gradient-charcoal text-primary-foreground p-8 shadow-lift lg:sticky lg:top-8"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/60">
                Plan sélectionné
              </p>
              <h2 className="mt-1 font-display text-4xl tracking-tight">{plan.name}</h2>
              <p className="mt-2 text-sm text-primary-foreground/70">{plan.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl tracking-tight">
                  {plan.priceMad.toLocaleString('fr-FR')}
                </span>
                <span className="font-display text-2xl">{plan.currency}</span>
                <span className="text-sm text-primary-foreground/60">{plan.intervalLabel}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground shrink-0">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="text-primary-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-label="Informations et paiement"
              className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-soft"
            >
              <CheckoutForm plan={plan} />
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
