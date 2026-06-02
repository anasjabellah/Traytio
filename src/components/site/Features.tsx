"use client";
import { motion } from "framer-motion";
import { ShoppingBag, FileText, Users, Sparkles, UtensilsCrossed, CalendarDays, MessageCircle, BarChart3, CreditCard } from "lucide-react";
import { SectionLabel } from "./ProblemSolution";

const features = [
  { icon: Sparkles, title: "Event Builder intelligent", desc: "Configurez un événement complet en quelques clics avec calcul de prix en temps réel.", span: "md:col-span-2 md:row-span-2", featured: true },
  { icon: ShoppingBag, title: "Gestion des commandes", desc: "Toutes vos commandes orchestrées dans une vue unique." },
  { icon: FileText, title: "Devis PDF", desc: "Devis et factures générés avec votre identité visuelle." },
  { icon: Users, title: "CRM Traiteur", desc: "Historique client, préférences, fréquence — tout en un." },
  { icon: UtensilsCrossed, title: "Menus dynamiques", desc: "Bibliothèque de menus saisonniers, prix variables." },
  { icon: CalendarDays, title: "Calendrier intelligent", desc: "Anti-conflits, équipes, équipements en temps réel.", span: "md:col-span-2" },
  { icon: MessageCircle, title: "WhatsApp intégré", desc: "Discussions clients liées aux commandes." },
  { icon: BarChart3, title: "Analytics avancés", desc: "Marges, saisonnalité, top clients." },
  { icon: CreditCard, title: "Paiements", desc: "Acomptes, échéanciers, relances automatiques." },
];

export function Features() {
  return (
    <section id="features" className="relative py-28 bg-surface-soft">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <div>
            <SectionLabel>Fonctionnalités</SectionLabel>
            <h2 className="font-display text-5xl lg:text-6xl tracking-tight max-w-3xl">
              Une suite complète, <span className="italic text-gradient-gold">pensée pour les pros.</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-md text-lg">
            Chaque outil de votre quotidien, réinventé avec la finition d'un produit premium.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.05 }}
              className={`group relative rounded-3xl border border-border bg-card p-7 overflow-hidden hover:shadow-lift transition-all ${f.span || ""} ${f.featured ? "bg-gradient-charcoal text-primary-foreground border-transparent" : ""}`}
            >
              {/* hover glow */}
              {!f.featured && (
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-gold opacity-0 group-hover:opacity-20 blur-2xl transition-opacity" />
              )}
              {f.featured && (
                <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-gradient-gold opacity-25 blur-3xl" />
              )}

              <div className="relative h-full flex flex-col">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.featured ? "bg-gradient-gold text-gold-foreground" : "bg-surface-soft border border-border text-foreground group-hover:bg-gradient-gold group-hover:text-gold-foreground group-hover:border-transparent transition-all"}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mt-auto pt-6">
                  <h3 className={`font-display text-2xl tracking-tight ${f.featured ? "text-primary-foreground" : ""}`}>{f.title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${f.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{f.desc}</p>
                </div>

                {f.featured && (
                  <div className="absolute top-0 right-0 inline-flex items-center gap-1.5 rounded-full glass-dark px-2.5 py-1 text-[10px] uppercase tracking-wider text-gold">
                    <Sparkles className="h-3 w-3" /> AI
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}