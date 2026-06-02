"use client";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { SectionLabel } from "./ProblemSolution";

const items = [
  {
    quote: "TUR a remplacé 4 outils différents. Mes devis partent en 2 minutes, mon équipe est alignée, et mes clients adorent le rendu PDF.",
    name: "Camille Lambert",
    role: "Fondatrice · Lambert Traiteur",
    initials: "CL",
  },
  {
    quote: "Fini WhatsApp en 47 conversations parallèles. Tout est centralisé, traçable, élégant. Le calendrier intelligent m'a évité 3 doubles bookings ce trimestre.",
    name: "Marc Béringer",
    role: "Directeur · Béringer Events",
    initials: "MB",
  },
  {
    quote: "L'Event Builder est bluffant. Je compose un menu pour 200 personnes en 5 minutes, avec marge calculée en direct. Ça change tout.",
    name: "Sofia Almeida",
    role: "Chef · Maison Almeida",
    initials: "SA",
  },
  {
    quote: "Une finition de produit que je n'avais jamais vue dans notre secteur. TUR donne une image premium à mon entreprise dès le premier devis.",
    name: "Julien Caron",
    role: "Traiteur indépendant",
    initials: "JC",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <div>
            <SectionLabel>Témoignages</SectionLabel>
            <h2 className="font-display text-5xl lg:text-6xl tracking-tight max-w-3xl">
              Adoptée par les <span className="italic text-gradient-gold">meilleurs traiteurs.</span>
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {items.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.08 }}
              className="relative group rounded-3xl border border-border bg-card p-8 hover:shadow-lift transition-all overflow-hidden"
            >
              <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-gradient-gold opacity-0 group-hover:opacity-20 blur-3xl transition-opacity" />
              <div className="relative">
                <div className="flex gap-0.5 text-gold-deep">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-5 font-display text-2xl lg:text-3xl leading-snug tracking-tight">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 pt-6 border-t border-border">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground text-xs font-semibold">
                    {t.initials}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </figcaption>
              </div>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}