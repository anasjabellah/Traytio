import type { Metadata } from "next";
import Link from "next/link";
import { Hourglass, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Paiement en cours de vérification",
  description: "Votre paiement est en cours de vérification.",
  robots: { index: false, follow: false },
};

/**
 * Post-checkout return page (ChariPay accept redirect target).
 * Display only: the `order` reference is echoed for reassurance and is
 * NEVER trusted as proof of payment — confirmation arrives exclusively
 * through the signed ChariPay webhook, which provisions the subscription.
 * Creates nothing: no User, Organization, Subscription, or email.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const orderLabel = typeof order === "string" && /^TUR-SUB-[A-Za-z0-9-]+$/.test(order) ? order : null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface-soft text-foreground">
        <div className="mx-auto max-w-2xl px-6 pt-24 pb-12 lg:pt-28 lg:pb-16 text-center">
          <div className="mx-auto size-14 rounded-2xl bg-gold-soft flex items-center justify-center mb-6">
            <Hourglass className="size-6 text-[var(--gold-deep)]" strokeWidth={1.8} />
          </div>
          <h1 className="font-display text-4xl lg:text-5xl tracking-tight">
            Paiement en cours de vérification
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Merci pour votre commande
            {orderLabel ? (
              <>
                {" "}<span className="font-mono text-sm font-semibold text-foreground">{orderLabel}</span>
              </>
            ) : null}
            . Nous confirmons actuellement votre paiement auprès de notre prestataire —
            vous recevrez votre lien d&apos;activation par email dès validation.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/tarifs"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Retour aux tarifs
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
