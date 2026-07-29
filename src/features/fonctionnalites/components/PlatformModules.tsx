"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { SectionLabel } from "@/components/site/ProblemSolution";
import { PLATFORM_MODULES } from "../constants";

const ease = [0.22, 1, 0.36, 1] as const;
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const itemAnim = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

export function PlatformModules() {
  return (
    <section id="modules" className="relative py-28 lg:py-36 bg-surface-soft">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center"
        >
          <SectionLabel>Modules</SectionLabel>
          <h2 className="font-display text-4xl lg:text-5xl tracking-tight max-w-3xl mx-auto leading-[1.05] text-foreground">
            Tout ce qu&apos;il vous faut,&nbsp;
            <span className="italic text-gradient-gold">rien de superflu.</span>
          </h2>
          <p className="mt-5 text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Chaque module a été pensé avec des traiteurs, pour couvrir votre quotidien sans complexité inutile.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {PLATFORM_MODULES.map((mod) => (
            <motion.div
              key={mod.title}
              variants={itemAnim}
              className="group relative rounded-3xl border border-border/60 bg-background p-8 hover:shadow-lift hover:border-gold/30 transition-all duration-500"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gold/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-gold/0 via-transparent to-transparent opacity-0 group-hover:from-gold/10 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
              <div className="relative">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gold/[0.08] border border-gold/20 mb-5 group-hover:bg-gold/[0.12] group-hover:border-gold/30 transition-colors duration-500">
                  <mod.icon className="size-5 text-gold-deep" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{mod.title}</h3>
                <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
                <hr className="my-5 border-border/40" />
                <ul className="space-y-2.5">
                  {mod.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <span className="flex size-[1.125rem] items-center justify-center rounded-full bg-gold/[0.12] shrink-0">
                        <Check className="size-2.5 text-gold-deep" />
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
