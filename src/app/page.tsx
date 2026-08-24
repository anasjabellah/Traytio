import type { Metadata } from "next";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Stats } from "@/components/site/Stats";
import { ProblemSolution } from "@/components/site/ProblemSolution";
import { Features } from "@/components/site/Features";
// import { EventBuilder } from "@/components/site/EventBuilder";
import { Pricing } from "@/components/site/Pricing";
import { Testimonials } from "@/components/site/Testimonials";
import { FAQ } from "@/components/site/FAQ";
import { FinalCTA } from "@/components/site/FinalCTA";
import { Footer } from "@/components/site/Footer";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "TUR — Le système d'exploitation des traiteurs modernes",
  description:
    "Plateforme SaaS premium pour traiteurs et catering : clients, devis, commandes, événements et paiements dans une seule interface.",
  keywords: [
    "traiteur",
    "catering",
    "logiciel traiteur",
    "gestion traiteur",
    "devis traiteur",
    "facture traiteur",
    "SaaS traiteur",
    "TUR",
  ],
  openGraph: {
    title: "TUR — Le système d'exploitation des traiteurs modernes",
    description:
      "Plateforme SaaS premium pour traiteurs et catering. Remplacez WhatsApp, Excel et papier par une suite élégante et puissante.",
    url: siteUrl,
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "TUR",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TUR — Le système d'exploitation des traiteurs modernes",
    description:
      "Plateforme SaaS premium pour traiteurs et catering. Remplacez WhatsApp, Excel et papier par une suite élégante et puissante.",
    images: ["/og-image.svg"],
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TUR",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Plateforme SaaS premium pour traiteurs et catering : clients, devis, commandes, événements et paiements.",
    url: siteUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "MAD",
      description: "Forfait Starter gratuit, puis à partir de 299 MAD/mois",
    },
    author: {
      "@type": "Organization",
      name: "TUR",
    },
    creator: {
      "@type": "Organization",
      name: "TUR",
    },
  };

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <Hero />
      <Stats />
      <ProblemSolution />
      <Features />
      {/* <EventBuilder /> */}
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}