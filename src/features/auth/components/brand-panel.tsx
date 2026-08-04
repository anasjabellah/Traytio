"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { DashboardMockup } from "./dashboard-mockup";

const highlights = [
  "Gestion des commandes",
  "Calendrier des événements",
  "Facturation",
  "Clients",
  "Paiements",
];

export function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden md:flex">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute inset-0 grid-bg" />
      <motion.div
        animate={{ y: [0, -10, 0], opacity: [0.25, 0.18, 0.25] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-24 -top-32 h-[480px] w-[480px] rounded-full bg-gradient-gold blur-3xl"
      />
      <div className="absolute -bottom-40 -right-32 h-[420px] w-[420px] rounded-full bg-gold/20 blur-3xl" />

      {/* Floating decorative shapes */}
      <div className="absolute left-10 top-1/2 hidden h-10 w-10 animate-float rounded-full border border-gold/30 bg-white/50 2xl:block" />
      <div className="absolute bottom-40 left-1/3 hidden h-6 w-6 animate-float rounded-full bg-gold-soft 2xl:block" />

      <div className="relative z-10 flex h-full w-full flex-col justify-between px-8 pb-6 pt-28 lg:px-10 xl:px-16">
        {/* Headline + highlights */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-gold opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-deep" />
              </span>
              Plateforme premium pour traiteurs
            </div>
            <h1 className="mt-6 font-display text-[2.1rem] leading-[1.05] tracking-tight md:text-[2.4rem] xl:text-[3.25rem]">
              Gérez votre activité
              <br />
              <span className="italic text-gradient-gold">traiteur</span> en toute
              simplicité.
            </h1>
          </motion.div>

          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3.5">
            {highlights.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.07 }}
                className="flex items-center gap-3 text-[15px] text-foreground/90"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold-deep">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                {item}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Mockup (desktop only) + trust */}
        <div className="mt-[4.875rem]">
          <div className="hidden lg:block">
            <DashboardMockup />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 flex items-center justify-center gap-3 text-center text-xs text-muted-foreground"
          >
            <span className="flex -space-x-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-6 w-6 rounded-full bg-gradient-gold ring-2 ring-background"
                  style={{ filter: `hue-rotate(${i * 15}deg)` }}
                />
              ))}
            </span>
            Déjà adopté par des professionnels de l&apos;événementiel.
          </motion.p>
        </div>
      </div>
    </aside>
  );
}
