"use client"

import { motion } from "framer-motion"
import { CalendarCheck, CreditCard, Sparkles, LifeBuoy, ShieldCheck, Clock } from "lucide-react"

const benefits = [
  { icon: CalendarCheck, title: "Démo personnalisée 7 jours", desc: "Accédez à un environnement complet pré-configuré pour votre activité." },
  { icon: CreditCard, title: "Aucune carte bancaire requise", desc: "Explorez la plateforme sans engagement, sans friction." },
  { icon: Sparkles, title: "Onboarding sur-mesure", desc: "Un expert TUR configure votre espace à vos process." },
  { icon: LifeBuoy, title: "Support dédié", desc: "Une équipe humaine, réactive et alignée sur vos objectifs." },
  { icon: ShieldCheck, title: "Plateforme cloud sécurisée", desc: "Chiffrement, sauvegardes, conformité RGPD — pensés pour les pros." },
]

export function DemoBenefits() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3 text-gold-deep" />
          Démo gratuite
        </div>
        <h1 className="mt-6 font-display text-[clamp(2.75rem,5vw,4.5rem)] leading-[0.98] tracking-tight">
          Demandez votre
          <br />
          <span className="italic text-gradient-gold">démo TUR.</span>
        </h1>
        <p className="mt-5 max-w-lg text-lg text-muted-foreground leading-relaxed">
          Découvrez comment TUR aide les traiteurs à gérer clients, événements, devis, factures et équipes — depuis une plateforme unique.
        </p>
      </div>

      <div className="grid gap-3">
        {benefits.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="group relative flex items-start gap-4 rounded-2xl border border-border bg-card p-4 hover:shadow-soft transition-all"
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

      <div className="rounded-2xl bg-gradient-charcoal text-primary-foreground p-5 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 size-40 rounded-full bg-gradient-gold opacity-25 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground">
            <Clock className="size-4" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-primary-foreground/60">Durée de la démo</div>
            <div className="font-display text-2xl">7 jours d'accès complet</div>
          </div>
        </div>
      </div>
    </div>
  )
}
