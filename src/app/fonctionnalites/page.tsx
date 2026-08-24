import type { Metadata } from "next";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FonctionnalitesHero } from "@/features/fonctionnalites/components/Hero";
import { DashboardShowcase } from "@/features/fonctionnalites/components/DashboardShowcase";
import { PlatformModules } from "@/features/fonctionnalites/components/PlatformModules";
import { WorkflowSection } from "@/features/fonctionnalites/components/WorkflowSection";
import { WhyTraytio } from "@/features/fonctionnalites/components/WhyTraytio";
import { FonctionnalitesFinalCTA } from "@/features/fonctionnalites/components/FinalCTA";

export const metadata: Metadata = {
  title: "Fonctionnalités",
  description:
    "Découvrez toutes les fonctionnalités Traytio : gestion d'événements, devis & factures, messagerie unifiée, paiements, analytics et automatisations. Conçu pour les traiteurs.",
  alternates: {
    canonical: "/fonctionnalites",
  },
};

export default function FonctionnalitesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <FonctionnalitesHero />
        <DashboardShowcase />
        <PlatformModules />
        <WorkflowSection />
        <WhyTraytio />
        <FonctionnalitesFinalCTA />
      </main>
      <Footer />
    </>
  );
}
