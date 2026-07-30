"use client"

import { motion } from "framer-motion"
import { Shield, Star } from "lucide-react"

const stats = [
  { value: "98%", label: "Satisfaction" },
  { value: "48h", label: "Déploiement moyen" },
  { value: "90%", label: "Adoption à 30 jours" },
]

export function DemoStats() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="group relative rounded-2xl border border-border bg-card p-5 hover:shadow-lift transition-all overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-gradient-gold opacity-0 group-hover:opacity-15 blur-3xl transition-opacity" />
        <div className="relative flex items-start gap-4">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-charcoal text-primary-foreground">
            <Shield className="size-5" />
          </span>
          <div>
            <div className="text-sm font-semibold tracking-tight">Sécurité &amp; RGPD</div>
            <div className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Données chiffrées en transit et au repos. Hébergement sécurisé en Europe. Conforme au RGPD.
              Nous ne partageons aucune information avec des tiers.
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border"
      >
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-4 text-center">
            <div className="font-display text-2xl text-gradient-charcoal">{s.value}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </motion.div>

      <motion.figure
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="group relative rounded-2xl border border-border bg-card p-5 hover:shadow-lift transition-all overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-gradient-gold opacity-0 group-hover:opacity-15 blur-3xl transition-opacity" />
        <div className="relative">
          <div className="flex gap-0.5 text-gold-deep mb-3">
            {Array.from({ length: 5 }).map((_, j) => (
              <Star key={j} className="h-3 w-3 fill-current" />
            ))}
          </div>
          <blockquote className="text-sm text-muted-foreground leading-relaxed">
            &ldquo;La démo nous a convaincus en 30 minutes. L&apos;équipe a compris nos besoins et tout était
            prêt le lendemain. Un professionnalisme rare.&rdquo;
          </blockquote>
          <figcaption className="mt-3 flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground text-[10px] font-semibold">
              CL
            </span>
            <div>
              <div className="text-xs font-semibold">Camille Lambert</div>
              <div className="text-[11px] text-muted-foreground">Lambert Traiteur</div>
            </div>
          </figcaption>
        </div>
      </motion.figure>
    </>
  )
}
