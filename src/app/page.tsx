import type { Metadata } from "next";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Stats } from "@/components/site/Stats";
import { ProblemSolution } from "@/components/site/ProblemSolution";
import { Features } from "@/components/site/Features";
// import { EventBuilder } from "@/components/site/EventBuilder";
import { Pricing } from "@/components/site/Pricing";
import { Testimonials } from "@/components/site/Testimonials";
import { FinalCTA } from "@/components/site/FinalCTA";
import { Footer } from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "TUR — Le système d'exploitation des traiteurs modernes",
  description: "Plateforme SaaS premium pour traiteurs et catering : clients, devis, commandes, événements et paiements dans une seule interface.",
  openGraph: {
    title: "TUR — Le système d'exploitation des traiteurs",
    description: "La plateforme premium pour traiteurs et catering. Remplacez WhatsApp, Excel et papier par une suite élégante et puissante.",
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <Hero />
      <Stats />
      <ProblemSolution />
      <Features />
      {/* <EventBuilder /> */}
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  );
}