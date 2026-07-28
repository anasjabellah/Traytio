"use client"

import { motion } from "framer-motion"
import { Check, Clock, Mail } from "lucide-react"

export function DemoSuccess() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative glass shadow-glass rounded-3xl p-8 sm:p-12 text-center overflow-hidden"
    >
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-64 rounded-full bg-gradient-gold opacity-30 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 180, damping: 14 }}
        className="relative mx-auto inline-flex size-16 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground shadow-gold"
      >
        <Check className="size-7" strokeWidth={3} />
      </motion.div>

      <h2 className="mt-6 font-display text-4xl sm:text-5xl tracking-tight">
        Merci !
      </h2>
      <p className="mt-4 max-w-md mx-auto text-muted-foreground leading-relaxed">
        Votre demande a bien été reçue. Notre équipe l'examinera et vous recontactera très prochainement.
      </p>

      <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold-soft border border-gold/30 px-4 py-2 text-xs font-medium text-gold-foreground">
        <Clock className="size-3.5 text-gold-deep" />
        Statut : en attente de validation
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-3 text-left">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="inline-flex size-9 items-center justify-center rounded-xl bg-surface-soft border border-border">
            <Mail className="size-4" />
          </div>
          <div className="mt-3 text-sm font-semibold">Réponse rapide</div>
          <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Vous recevrez un email de confirmation dès qu'un membre de notre équipe aura examiné votre dossier.
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="inline-flex size-9 items-center justify-center rounded-xl bg-surface-soft border border-border">
            <Clock className="size-4" />
          </div>
          <div className="mt-3 text-sm font-semibold">Prochaine étape</div>
          <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Après validation, vous bénéficierez de 7 jours d'accès complet à la plateforme TUR.
          </div>
        </div>
      </div>
    </motion.div>
  )
}
