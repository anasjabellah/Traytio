"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SectionLabel } from "./ProblemSolution";

const items = [
  {
    q: "Qu'est-ce que TUR ?",
    a: "TUR est une plateforme SaaS tout-en-un conçue pour les traiteurs et professionnels du catering. Elle remplace vos outils disparates — WhatsApp, Excel, carnets papier — par une suite centralisée et élégante.",
  },
  {
    q: "Combien coûte TUR ?",
    a: "TUR propose un forfait Starter gratuit pour découvrir la plateforme, puis un forfait Pro à 599 MAD/mois. Pas de frais cachés, pas d'engagement au-delà du mois.",
  },
  {
    q: "Puis-je essayer TUR gratuitement ?",
    a: "Oui, vous bénéficiez d'une période d'essai de 14 jours sans carte bancaire, avec accès à toutes les fonctionnalités Pro.",
  },
  {
    q: "TUR est-il adapté à mon type d'activité ?",
    a: "Que vous soyez traiteur indépendant, chef de cuisine, organisateur d'événements ou entreprise de restauration collective, TUR s'adapte à votre flux de travail.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Absolument. Vos données sont chiffrées en transit et au repos, hébergées sur des serveurs sécurisés en Europe. Nous ne partageons aucune information avec des tiers.",
  },
];

function FAQItem({ q, a, isOpen, onClick }: { q: string; a: string; isOpen: boolean; onClick: () => void }) {
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

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-14">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="font-display text-5xl lg:text-6xl tracking-tight mt-4">
              Questions fréquentes
            </h2>
          </div>
          <div className="rounded-2xl border border-border bg-card px-6">
            {items.map((item, i) => (
              <FAQItem
                key={item.q}
                q={item.q}
                a={item.a}
                isOpen={openIndex === i}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
