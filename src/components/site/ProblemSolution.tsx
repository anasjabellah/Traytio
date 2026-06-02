"use client";
import { motion } from "framer-motion";
import { X, Check, MessageCircle, FileSpreadsheet, FileText, Calendar, AlertCircle, Layers } from "lucide-react";

const before = [
  { icon: MessageCircle, text: "Conversations WhatsApp chaotiques" },
  { icon: FileSpreadsheet, text: "Fichiers Excel éparpillés" },
  { icon: FileText, text: "Devis perdus sur papier" },
  { icon: AlertCircle, text: "Doubles bookings & oublis" },
  { icon: Calendar, text: "Calendrier ingérable" },
];

const after = [
  { icon: Layers, text: "Une seule plateforme centralisée" },
  { icon: FileText, text: "Devis PDF générés en 30 secondes" },
  { icon: Calendar, text: "Calendrier intelligent anti-conflits" },
  { icon: MessageCircle, text: "WhatsApp intégré nativement" },
  { icon: Check, text: "Tout traçable, tout sécurisé" },
];

export function ProblemSolution() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel>Avant · Après</SectionLabel>
        <h2 className="font-display text-5xl lg:text-6xl tracking-tight max-w-3xl">
          Du chaos quotidien à une <span className="italic text-gradient-gold">élégante orchestration.</span>
        </h2>

        <div className="mt-16 grid lg:grid-cols-2 gap-6 relative">
          {/* Divider arrow */}
          {/* <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="h-14 w-14 rounded-full bg-foreground text-primary-foreground flex items-center justify-center shadow-lift">
              <span className="font-display text-xl">→</span>
            </div>
          </div> */}

          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl bg-surface-soft border border-border p-8 lg:p-10"
          >
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-6">
              <span className="h-2 w-2 rounded-full bg-destructive/60" /> Avant TUR
            </div>
            <ul className="space-y-3">
              {before.map((b, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl bg-card border border-border/60 px-4 py-3.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/5 text-destructive/70">
                    <b.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-muted-foreground line-through decoration-destructive/30 flex-1">{b.text}</span>
                  <X className="h-4 w-4 text-destructive/50" />
                </li>
              ))}
            </ul>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative rounded-3xl bg-gradient-charcoal p-8 lg:p-10 text-primary-foreground overflow-hidden shadow-lift"
          >
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-gold opacity-20 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-gold mb-6">
                <span className="h-2 w-2 rounded-full bg-gold" /> Avec TUR
              </div>
              <ul className="space-y-3">
                {after.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl glass-dark px-4 py-3.5">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground">
                      <a.icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm flex-1">{a.text}</span>
                    <Check className="h-4 w-4 text-gold" />
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-6">
      <span className="h-px w-8 bg-gradient-gold" />
      <span className="text-xs uppercase tracking-[0.2em] text-gold-deep font-medium">{children}</span>
    </div>
  );
}