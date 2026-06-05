"use client"

import { motion } from "framer-motion";

export function StepCard({
  step, title, subtitle, children, highlight, icon,
}: {
  step: number; title: string; subtitle?: string; children: React.ReactNode; highlight?: boolean; icon?: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-[1.75rem] border bg-card p-7 transition-shadow ${
        highlight ? "border-gold shadow-gold" : "border-border/70 shadow-soft hover:shadow-lift"
      }`}
    >
      <header className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-medium tabular-nums ${
            highlight ? "bg-gradient-gold text-gold-foreground" : "bg-foreground text-primary-foreground"
          }`}>
            {String(step).padStart(2, "0")}
          </div>
          <div>
            <h2 className="font-display text-2xl tracking-tight flex items-center gap-2">
              {title}
              {icon && <span className="text-muted-foreground">{icon}</span>}
            </h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </header>
      {children}
    </motion.section>
  );
}
