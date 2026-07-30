import { Sparkles } from "lucide-react"

export function DemoHero() {
  return (
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
  )
}
