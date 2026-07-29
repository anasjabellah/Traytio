"use client";
import { motion } from "framer-motion";
import { SectionLabel } from "@/components/site/ProblemSolution";
import { WHY_TRAYTIO } from "../constants";

const ease = [0.22, 1, 0.36, 1] as const;
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const itemAnim = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

export function WhyTraytio() {
  return (
    <section className="relative py-28 lg:py-36 bg-surface-soft">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center"
        >
          <SectionLabel>Pourquoi Traytio</SectionLabel>
          <h2 className="font-display text-4xl lg:text-5xl tracking-tight max-w-3xl mx-auto leading-[1.05] text-foreground">
            Conçu par des traiteurs,&nbsp;
            <span className="italic text-gradient-gold">validé par des experts.</span>
          </h2>
          <p className="mt-5 text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Nous avons passé des centaines d&apos;heures en cuisine avec des traiteurs pour comprendre chaque douleur, chaque besoin, chaque exigence.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {WHY_TRAYTIO.map((reason) => (
            <motion.div
              key={reason.title}
              variants={itemAnim}
              className="group relative rounded-3xl border border-border/60 bg-background p-8 hover:shadow-lift hover:border-gold/30 transition-all duration-500"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gold/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-gold/0 via-transparent to-transparent opacity-0 group-hover:from-gold/10 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
              <div className="relative">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gold/[0.08] border border-gold/20 mb-5 group-hover:bg-gold/[0.12] group-hover:border-gold/30 transition-colors duration-500">
                  <reason.icon className="size-5 text-gold-deep" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{reason.title}</h3>
                <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">{reason.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
