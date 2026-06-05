"use client"

import { ArrowLeft, Sparkles } from "lucide-react";

export function PageHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <button className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Retour aux commandes
        </button>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-gold-deep" /> Event Builder
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">Brouillon · enregistré il y a 2s</div>
        </div>
        <h1 className="mt-3 font-display text-5xl lg:text-6xl tracking-tight">
          Nouvelle <span className="italic text-gradient-gold">commande</span>
        </h1>
        <p className="mt-2 text-muted-foreground max-w-xl">
          Composez l'événement complet — du client au devis — dans un seul flux orchestré.
        </p>
      </div>
    </div>
  );
}
