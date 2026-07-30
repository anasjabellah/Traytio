"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqItems = [
  { q: "Combien de temps dure la démo ?", a: "Vous bénéficiez d'un accès complet pendant 7 jours. Pas de limite, pas de restriction — vous explorez la plateforme à votre rythme." },
  { q: "Dois-je fournir une carte bancaire ?", a: "Non. Aucune carte bancaire n'est demandée. Vous découvrez TUR sans engagement, sans risque." },
  { q: "Que se passe-t-il après la démo ?", a: "Un membre de notre équipe vous recontacte pour recueillir vos impressions et vous proposer le forfait adapté à votre activité. Vous choisissez librement." },
]

export function DemoFaq() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
        Questions fréquentes
      </div>
      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {faqItems.map((item, i) => (
          <div key={item.q}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              aria-expanded={openFaq === i}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg"
            >
              <span className="font-medium">{item.q}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openFaq === i && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}
