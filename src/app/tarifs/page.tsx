import type { Metadata } from "next";
import { Navbar } from "@/components/site/Navbar";
import { Pricing } from "@/components/site/Pricing";
import { TarifsFinalCTA } from "@/features/tarifs/components/final-cta";
import { Footer } from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Tarifs — TUR",
  description:
    "Découvrez les offres TUR pour les traiteurs et professionnels du catering. Starter, Pro et Entreprise.",
  alternates: {
    canonical: "/tarifs",
  },
};

export default function TarifsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <div className="pt-28" />
        <Pricing headingLevel={1} />
        <TarifsFinalCTA />
      </main>
      <Footer />
    </>
  );
}
