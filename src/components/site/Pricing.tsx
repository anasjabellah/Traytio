"use client";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { SectionLabel } from "./ProblemSolution";

const plans = [
  {
    name: "Starter",
    price: "49",
    suffix: "€",
    per: "/mois",
    desc: "Fonctionnalités essentielles pour petites structures.",
    features: ["Jusqu'à 30 événements/mois", "CRM clients", "Devis & factures PDF", "Calendrier intelligent", "Support email"],
    cta: "Commencer",
  },
  {
    name: "Professionnel",
    price: "149",
    suffix: "€",
    per: "/mois",
    desc: "Toutes les fonctionnalités + automatisations avancées.",
    features: ["Événements illimités", "Event Builder IA", "WhatsApp intégré", "Analytics avancés", "Paiements automatisés", "Support prioritaire 24/7"],
    cta: "Commencer",
    featured: true,
  },
  {
    name: "Entreprise",
    price: "Sur devis",
    desc: "Solutions personnalisées pour grands groupes.",
    features: ["Multi-établissements", "API & intégrations sur mesure", "Onboarding dédié", "SLA & sécurité avancée", "Customer Success Manager"],
    cta: "Nous contacter",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-28 bg-surface-soft">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex justify-center"><SectionLabel>Tarifs</SectionLabel></div>
          <h2 className="font-display text-5xl lg:text-6xl tracking-tight">
            Un investissement, <span className="italic text-gradient-gold">jamais une dépense.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">Choisissez le plan qui accompagne votre croissance.</p>
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
                  ? "bg-gradient-charcoal text-primary-foreground shadow-lift scale-105 lg:scale-105"
                  : "bg-card border border-border hover:shadow-lift"
              }`}
            >
              {p.featured && (
                <>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-gold text-gold-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-gold">
                    <Sparkles className="h-3 w-3" /> Le plus populaire
                  </div>
                  <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-gold opacity-25 blur-3xl pointer-events-none" />
                </>
              )}

              <div className="relative">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-3xl tracking-tight">{p.name}</h3>
                </div>
                <p className={`mt-2 text-sm ${p.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{p.desc}</p>

                <div className="mt-8 flex items-baseline gap-1">
                  <span className="font-display text-5xl lg:text-6xl tracking-tight">{p.price}</span>
                  {p.suffix && <span className="font-display text-3xl">{p.suffix}</span>}
                  {p.per && <span className={`text-sm ${p.featured ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{p.per}</span>}
                </div>

                <a
                  href="#"
                  className={`mt-8 group/btn inline-flex items-center justify-center gap-2 w-full rounded-full py-3 text-sm font-medium transition-all ${
                    p.featured
                      ? "bg-gradient-gold text-gold-foreground hover:shadow-gold"
                      : "bg-foreground text-primary-foreground hover:bg-foreground/90"
                  }`}
                >
                  {p.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                </a>

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