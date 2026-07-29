"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Mail, ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SectionLabel } from "@/components/site/ProblemSolution";

const categories = [
  {
    id: "general",
    label: "Général",
    items: [
      {
        q: "Qu'est-ce que TUR ?",
        a: "TUR est une plateforme SaaS tout-en-un conçue pour les traiteurs et professionnels du catering. Elle remplace vos outils disparates — WhatsApp, Excel, carnets papier — par une suite centralisée et élégante : CRM, devis, commandes, événements, paiements et analytics.",
      },
      {
        q: "À qui s'adresse TUR ?",
        a: "TUR s'adresse à tous les professionnels de la restauration événementielle : traiteurs indépendants, chefs de cuisine, organisateurs d'événements, entreprises de restauration collective. Que vous gériez 10 ou 200 événements par mois, TUR s'adapte à votre flux de travail.",
      },
      {
        q: "TUR remplace-t-il vraiment plusieurs outils ?",
        a: "Oui. TUR centralise CRM, devis PDF, commandes, calendrier, paiements et analytics dans une seule interface. Fini les allers-retours entre WhatsApp, Excel, un logiciel de facturation et un calendrier papier.",
      },
    ],
  },
  {
    id: "tarifs",
    label: "Tarifs & Essai",
    items: [
      {
        q: "Combien coûte TUR ?",
        a: "TUR propose un forfait Starter gratuit pour découvrir la plateforme, puis un forfait Pro à 599 MAD/mois. Le forfait Pro inclut toutes les fonctionnalités avancées : événements illimités, analytics, intégration WhatsApp et paiements. Pas de frais cachés, pas d'engagement au-delà du mois.",
      },
      {
        q: "Puis-je essayer TUR gratuitement ?",
        a: "Oui, vous bénéficiez d'une période d'essai de 14 jours sans carte bancaire, avec accès à toutes les fonctionnalités Pro. Aucune limite, aucune contrainte. Si TUR ne vous convient pas, vous pouvez annuler à tout moment.",
      },
      {
        q: "Existe-t-il un engagement ?",
        a: "Aucun engagement. Tous nos forfaits sont mensuels et résiliables à tout moment. Vous pouvez passer de Starter à Pro quand vous le souhaitez, et inversement.",
      },
    ],
  },
  {
    id: "features",
    label: "Fonctionnalités",
    items: [
      {
        q: "Comment fonctionne l'Event Builder ?",
        a: "L'Event Builder vous permet de configurer un événement complet en quelques clics : sélection du type d'événement, choix du menu, nombre de convives, options additionnelles. Le prix est calculé en temps réel avec vos marges, et un devis PDF est généré automatiquement.",
      },
      {
        q: "Puis-je personnaliser mes devis PDF ?",
        a: "Oui. Les devis PDF sont générés avec votre identité visuelle : logo, couleurs, typographie. Vous pouvez choisir parmi plusieurs templates premium et personnaliser chaque section. Le rendu est prêt à envoyer au client.",
      },
      {
        q: "Comment fonctionne l'intégration WhatsApp ?",
        a: "Les conversations WhatsApp sont directement liées à vos commandes et événements. Plus besoin de chercher une conversation dans votre messagerie : chaque message est associé à un client, une commande ou un événement.",
      },
    ],
  },
  {
    id: "technique",
    label: " Technique & Sécurité",
    items: [
      {
        q: "Mes données sont-elles sécurisées ?",
        a: "Absolument. Vos données sont chiffrées en transit (TLS 1.3) et au repos (AES-256). Elles sont hébergées sur des serveurs sécurisés en Europe. Nous ne partageons aucune information avec des tiers. TUR est conforme au RGPD.",
      },
      {
        q: "Puis-je exporter mes données ?",
        a: "Oui. Vous pouvez exporter vos données à tout moment au format CSV ou PDF. Nous croyons à la portabilité des données : vous restez propriétaire de vos informations.",
      },
      {
        q: "TUR fonctionne-t-il sur mobile ?",
        a: "Oui, TUR est entièrement responsive et fonctionne sur tous les appareils : ordinateur, tablette et smartphone. Une application mobile native est en cours de développement.",
      },
    ],
  },
];

function AccordionItem({ q, a, isOpen, onClick }: { q: string; a: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onClick}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg px-2 -mx-2"
      >
        <span className="font-medium text-base">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-muted-foreground leading-relaxed px-2 -mx-2">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategorySection({ category, openItem, onToggle }: { category: typeof categories[number]; openItem: string | null; onToggle: (id: string) => void }) {
  return (
    <div>
      <h3 className="font-display text-2xl tracking-tight mb-4">{category.label}</h3>
      <div className="rounded-2xl border border-border bg-card px-6">
        {category.items.map((item) => {
          const itemId = `${category.id}-${item.q}`;
          return (
            <AccordionItem
              key={item.q}
              q={item.q}
              a={item.a}
              isOpen={openItem === itemId}
              onClick={() => onToggle(itemId)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[600px] bg-radiance" />

      {/* Hero */}
      <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-28">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SectionLabel>FAQ</SectionLabel>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-6 font-display text-[clamp(3rem,6vw,5.5rem)] leading-[0.95] tracking-tight"
          >
            Questions{" "}
            <span className="italic text-gradient-gold">fréquentes.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed"
          >
            Tout ce que vous devez savoir avant de commencer avec Traytio.
          </motion.p>
        </div>
      </section>

      {/* FAQ categories + accordion */}
      <section className="relative pb-20">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
            className="space-y-12"
          >
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <CategorySection
                  category={cat}
                  openItem={openItem}
                  onToggle={handleToggle}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact support card */}
      <section className="relative pb-20">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-[2rem] border border-border bg-card overflow-hidden p-10 lg:p-14 text-center"
          >
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-gradient-gold opacity-[0.07] blur-3xl pointer-events-none" />
            <div className="relative">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-gold/10 text-gold-deep mb-5">
                <HelpCircle className="h-7 w-7" />
              </span>
              <h2 className="font-display text-3xl lg:text-4xl tracking-tight">
                Vous ne trouvez pas votre réponse&nbsp;?
              </h2>
              <p className="mt-3 text-muted-foreground text-lg max-w-md mx-auto">
                Notre équipe est là pour vous aider. Contactez-nous et nous vous répondrons sous 24&nbsp;h.
              </p>
              <div className="mt-8">
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-2 rounded-full bg-foreground text-primary-foreground pl-6 pr-4 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Nous contacter
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative pb-28">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-[2rem] bg-gradient-charcoal text-primary-foreground overflow-hidden p-12 lg:p-20 text-center"
          >
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-[120%] bg-gradient-gold opacity-25 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full glass-dark px-3 py-1.5 text-xs text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                Disponible dès aujourd&apos;hui
              </div>
              <h2 className="mt-6 font-display text-5xl lg:text-7xl tracking-tight max-w-4xl mx-auto leading-[1]">
                Prêt à transformer votre activité&nbsp;?
                <br />
                <span className="italic text-gradient-gold">Essayez Traytio gratuitement.</span>
              </h2>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/#pricing"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-gold text-gold-foreground px-7 py-3.5 text-sm font-semibold shadow-gold hover:scale-[1.02] transition-transform"
                >
                  Commencer maintenant
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/demo"
                  className="group inline-flex items-center gap-2 rounded-full glass-dark px-7 py-3.5 text-sm font-medium text-primary-foreground hover:bg-white/5 transition-colors"
                >
                  <CalendarDays className="h-4 w-4" />
                  Réserver une démo
                </Link>
              </div>
              <p className="mt-6 text-xs text-primary-foreground/50">Sans carte bancaire · 14 jours d&apos;essai · Annulation à tout moment</p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
