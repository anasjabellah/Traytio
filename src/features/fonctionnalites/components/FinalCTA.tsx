"use client";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

export function FonctionnalitesFinalCTA() {
  return (
    <section className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="relative rounded-[2rem] bg-gradient-charcoal text-primary-foreground overflow-hidden p-12 lg:p-20 text-center"
        >
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[30rem] w-[120%] bg-gradient-gold opacity-20 blur-[100px] pointer-events-none" />
          <div className="absolute inset-0 grid-bg opacity-[0.10] pointer-events-none" />
          <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/20 backdrop-blur-md border border-white/[0.08] px-4 py-2 text-xs tracking-wider text-white/70">
              <span className="size-1.5 rounded-full bg-gold animate-pulse shadow-[0_0_6px_rgba(201,169,110,0.6)]" />
              Disponible dès aujourd&apos;hui
            </div>

            <h2 className="mt-8 font-display text-[clamp(1.75rem,4.5vw,3.75rem)] leading-[1.05] tracking-tight max-w-4xl mx-auto">
              Prêt à révolutionner votre
              <br />
              activité de traiteur&nbsp;?
              <br />
              <span className="italic text-gradient-gold">Essayez Traytio gratuitement.</span>
            </h2>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/demo"
                className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-gold text-gold-foreground px-8 py-4 text-sm font-semibold shadow-gold hover:scale-[1.03] hover:shadow-lg transition-all duration-300"
              >
                Demander une démo
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            <p className="mt-6 text-xs text-white/40">
              Sans carte bancaire &middot; 14 jours d&apos;essai &middot; Annulation à tout moment
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
