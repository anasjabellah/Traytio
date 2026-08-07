"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SectionLabel } from "./ProblemSolution";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formatAnnual = (m: number) => (m * 12).toLocaleString("fr-FR");

const plans = [
  {
    name: "Starter",
    monthly: 299,
    desc: "Fonctionnalités essentielles pour démarrer votre activité.",
    href: "/demo",
    features: [
      "Jusqu'à 30 événements / mois",
      "Gestion des clients",
      "Devis & factures illimités",
      "Calendrier des événements",
      "Tableau de bord",
      "Support par e-mail",
    ],
    cta: "Commencer",
  },
  {
    name: "Professionnel",
    monthly: 599,
    desc: "Pour les traiteurs qui souhaitent développer leur activité.",
    href: "/demo",
    features: [
      "Événements illimités",
      "Gestion des équipes",
      "Menus & prestations",
      "Paiements & suivi financier",
      "Tableau de bord avancé",
      "Support prioritaire",
    ],
    cta: "Commencer",
    featured: true,
  },
  {
    name: "Entreprise",
    price: "Sur devis",
    desc: "Solution sur mesure pour les grandes organisations.",
    href: "/contact",
    features: [
      "Multi-établissements",
      "Gestion de plusieurs équipes",
      "Rôles & permissions avancés",
      "Accompagnement personnalisé",
      "Support prioritaire",
      "Intégrations sur mesure",
    ],
    cta: "Demander un devis",
  },
];

type PricingProps = {
  headingLevel?: 1 | 2;
};

export function Pricing({ headingLevel = 2 }: PricingProps) {
  const [annual, setAnnual] = useState(false);
  const Heading = `h${headingLevel}` as "h1" | "h2";

  return (
    <section id="pricing" className="relative py-28 bg-surface-soft">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex justify-center"><SectionLabel>Tarifs</SectionLabel></div>
          <Heading className="font-display text-5xl lg:text-6xl tracking-tight">
            Un investissement, <span className="italic text-gradient-gold">jamais une dépense.</span>
          </Heading>
          <p className="mt-5 text-lg text-muted-foreground">Choisissez le plan qui accompagne votre croissance.</p>

          <div
            className="mt-8 inline-flex items-center rounded-full bg-card border border-border p-0.5 shadow-soft"
            role="group"
            aria-label="Période de facturation"
          >
            <button
              type="button"
              onClick={() => setAnnual(false)}
              aria-pressed={!annual}
              className={`rounded-full px-5 py-3.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
                !annual ? "bg-foreground text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              aria-pressed={annual}
              className={`rounded-full px-5 py-3.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
                annual ? "bg-foreground text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annuel <span className="text-gold-deep font-semibold">-15%</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className={`relative group rounded-3xl p-8 transition-all ${
                p.featured
                  ? "bg-gradient-charcoal text-primary-foreground shadow-lift lg:scale-105"
                  : "bg-card border border-border hover:shadow-lift"
              }`}
            >
              {p.featured && (
                <>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-gold text-gold-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-gold">
                    <Sparkles className="h-3 w-3" /> LE PLUS POPULAIRE
                  </div>
                  <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-gold opacity-25 blur-3xl pointer-events-none" />
                </>
              )}

              <div className="relative">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-3xl tracking-tight">{p.name}</h3>
                </div>
                <p className={`mt-2 text-sm ${p.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{p.desc}</p>

                <div className="mt-8">
                  {p.monthly ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-5xl lg:text-6xl tracking-tight">{p.monthly}</span>
                        <span className="font-display text-3xl">MAD</span>
                        <span className={`text-sm ${p.featured ? "text-primary-foreground/60" : "text-muted-foreground"}`}>/mois</span>
                      </div>
                      {annual && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-xs ${p.featured ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                            Facturé {formatAnnual(p.monthly)} MAD/an
                          </span>
                          <span className="text-[10px] font-medium text-gold-deep bg-gold-soft px-2 py-0.5 rounded-full">
                            Économisez 15%
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="font-display text-5xl lg:text-6xl tracking-tight">{p.price}</span>
                  )}
                </div>

                <Link
                  href={p.href}
                  className={cn(
                    buttonVariants({ variant: p.featured ? "gold" : "charcoal", size: "xl" }),
                    "group/btn mt-8 w-full"
                  )}
                >
                  {p.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                </Link>

                <ul className="mt-8 space-y-3.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0 ${p.featured ? "bg-gradient-gold text-gold-foreground" : "bg-gold-soft text-gold-deep"}`}>
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className={p.featured ? "text-primary-foreground/90" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
