"use client";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-[2rem] bg-gradient-charcoal text-primary-foreground overflow-hidden p-12 lg:p-20 text-center"
        >
          {/* lights */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-[120%] bg-gradient-gold opacity-25 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full glass-dark px-3 py-1.5 text-xs text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              Disponible dès aujourd'hui
            </div>
            <h2 className="mt-6 font-display text-5xl lg:text-7xl tracking-tight max-w-4xl mx-auto leading-[1]">
              Transformez votre activité traiteur avec
              <br />
              <span className="italic text-gradient-gold">une plateforme pensée pour l'excellence.</span>
            </h2>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#pricing"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-gold text-gold-foreground px-7 py-3.5 text-sm font-semibold shadow-gold hover:scale-[1.02] transition-transform"
              >
                Commencer maintenant
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#demo"
                className="group inline-flex items-center gap-2 rounded-full glass-dark px-7 py-3.5 text-sm font-medium text-primary-foreground hover:bg-white/5 transition-colors"
              >
                <CalendarDays className="h-4 w-4" />
                Réserver une démo
              </a>
            </div>
            <p className="mt-6 text-xs text-primary-foreground/50">Sans carte bancaire · 14 jours d'essai · Annulation à tout moment</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}