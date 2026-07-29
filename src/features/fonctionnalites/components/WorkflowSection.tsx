"use client";
import { motion } from "framer-motion";
import { SectionLabel } from "@/components/site/ProblemSolution";
import { WORKFLOW_STEPS } from "../constants";

const ease = [0.22, 1, 0.36, 1] as const;
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const itemAnim = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

export function WorkflowSection() {
  return (
    <section className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center"
        >
          <SectionLabel>Fonctionnement</SectionLabel>
          <h2 className="font-display text-4xl lg:text-5xl tracking-tight max-w-3xl mx-auto leading-[1.05] text-foreground">
            Commencez en&nbsp;
            <span className="italic text-gradient-gold">quelques minutes.</span>
          </h2>
          <p className="mt-5 text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Pas de configuration longue, pas de courbe d&apos;apprentissage. Vous êtes opérationnel dès votre premier clic.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6 relative"
        >
          <div className="hidden lg:block absolute top-[2.625rem] left-[calc(8.33%+2.5rem)] right-[calc(8.33%+2.5rem)] h-0.5 bg-gradient-to-r from-gold/20 via-gold/50 to-gold/20 pointer-events-none rounded-full" />

          {WORKFLOW_STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              variants={itemAnim}
              className="relative flex flex-col items-center text-center group"
            >
              <div className="relative mb-6">
                <div className="flex size-[5.25rem] items-center justify-center rounded-full border-2 border-gold/25 bg-background shadow-soft group-hover:border-gold/50 group-hover:shadow-gold/20 transition-all duration-500">
                  <step.icon className="size-8 text-gold-deep" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full bg-gradient-gold text-[11px] font-bold text-gold-foreground shadow-gold">
                  {i + 1}
                </div>
              </div>
              <h3 className="text-sm lg:text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-xs lg:text-sm text-muted-foreground leading-relaxed max-w-[16ch]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
