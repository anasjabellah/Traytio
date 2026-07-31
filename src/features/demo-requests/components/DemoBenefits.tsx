"use client"

import { motion } from "framer-motion"
import { CalendarCheck, CreditCard, Sparkles, LifeBuoy, ShieldCheck } from "lucide-react"

const benefits = [
  { icon: CalendarCheck, title: "Démo personnalisée 7 jours", desc: "Accédez à un environnement complet pré-configuré pour votre activité." },
  { icon: CreditCard, title: "Aucune carte bancaire requise", desc: "Explorez la plateforme sans engagement, sans friction." },
  { icon: Sparkles, title: "Onboarding sur-mesure", desc: "Un expert TUR configure votre espace à vos process." },
  { icon: LifeBuoy, title: "Support dédié", desc: "Une équipe humaine, réactive et alignée sur vos objectifs." },
  { icon: ShieldCheck, title: "Plateforme cloud sécurisée", desc: "Chiffrement, sauvegardes, conformité RGPD — pensés pour les pros." },
]

export function DemoBenefits() {
  return (
    <div className="grid gap-3">
      {benefits.map((b, i) => (
        <motion.div
          key={b.title}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="motion-safe group relative flex items-start gap-4 rounded-2xl border border-border bg-card p-4 hover:shadow-soft transition-all"
        >
          <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-soft border border-border text-foreground group-hover:bg-gradient-gold group-hover:text-gold-foreground group-hover:border-transparent transition-all">
            <b.icon className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">{b.title}</div>
            <div className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{b.desc}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
