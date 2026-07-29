"use client";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function FonctionnalitesHero() {
  return (
    <section className="relative pt-36 pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[1200px] bg-radiance pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-gold animate-ping opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-deep" />
          </span>
          Une plateforme, tout votre métier
          <Sparkles className="h-3 w-3 text-gold-deep" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-10 font-display text-[clamp(2.4rem,5.2vw,4.6rem)] leading-[0.95] tracking-tight max-w-4xl mx-auto"
        >
          Tout ce dont un traiteur a besoin&mdash;
          <br />
          <span className="italic text-gradient-gold">réuni au même endroit.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-6 max-w-xl mx-auto text-lg text-muted-foreground leading-relaxed"
        >
          De la prise de commande à la facturation, en passant par la gestion d&apos;équipe et les paiements&nbsp;: Traytio centralise tout votre métier de traiteur au même endroit.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/demo"
            className="group inline-flex items-center gap-2 rounded-full bg-foreground text-primary-foreground px-6 py-3.5 text-sm font-medium shadow-lift hover:shadow-gold transition-all"
          >
            Demander une démo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#modules"
            className="group inline-flex items-center gap-2 rounded-full glass px-6 py-3.5 text-sm font-medium hover:shadow-soft transition-all"
          >
            Explorer la plateforme
          </a>
        </motion.div>
      </div>
    </section>
  );
}
