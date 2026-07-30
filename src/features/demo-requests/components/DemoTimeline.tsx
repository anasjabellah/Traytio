"use client"

import { motion } from "framer-motion"
import { CheckCircle, Sparkles, Clock, MessageCircle } from "lucide-react"

const steps = [
  { icon: CheckCircle, title: "Validation sous 24h", desc: "Notre équipe vérifie votre demande et vous contacte pour confirmer vos besoins." },
  { icon: Sparkles, title: "Onboarding personnalisé", desc: "Votre espace TUR est configuré sur mesure selon votre activité et vos processus." },
  { icon: Clock, title: "Environnement de démo", desc: "Vous recevez un accès complet à un environnement pré-rempli avec vos données types." },
  { icon: MessageCircle, title: "Session Q&A dédiée", desc: "Un expert répond à toutes vos questions et vous guide dans vos premiers pas." },
]

export function DemoTimeline() {
  return (
    <>
      <div className="rounded-2xl bg-gradient-charcoal text-primary-foreground p-5 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 size-40 rounded-full bg-gradient-gold opacity-25 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground">
            <Clock className="size-4" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-primary-foreground/60">Durée de la démo</div>
            <div className="font-display text-2xl">7 jours d&apos;accès complet</div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
          Après votre demande
        </div>
        <div className="grid gap-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative flex items-start gap-4 rounded-2xl border border-border bg-card p-4 hover:shadow-soft transition-all"
            >
              <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-gold/10 text-gold-deep group-hover:bg-gradient-gold group-hover:text-gold-foreground transition-all">
                <s.icon className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">{s.title}</div>
                <div className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{s.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  )
}
