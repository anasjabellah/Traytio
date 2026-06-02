"use client";
import { motion } from "framer-motion";

const stats = [
  { value: "48 000+", label: "Événements gérés" },
  { value: "12h", label: "Économisées par semaine" },
  { value: "1 200+", label: "Traiteurs actifs" },
  { value: "98%", label: "Satisfaction clients" },
];

export function Stats() {
  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-3xl overflow-hidden shadow-soft border border-border">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group relative bg-card p-8 lg:p-10 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-[0.06] transition-opacity" />
              <div className="relative">
                <div className="font-display text-5xl lg:text-6xl text-gradient-charcoal">{s.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
              </div>
              <div className="absolute -bottom-px left-0 h-px w-0 bg-gradient-gold group-hover:w-full transition-all duration-700" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}