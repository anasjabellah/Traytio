"use client"

import { motion } from "framer-motion";
import { Package, Check } from "lucide-react";
import { PACKS } from "@/features/commandes/data/mock-data";

export function PackStep({ selectedPack, onSelect }: { selectedPack: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {PACKS.map((p) => {
        const active = selectedPack === p.id;
        return (
          <motion.button
            key={p.id}
            whileHover={{ y: -3 }}
            onClick={() => onSelect(p.id)}
            className={`relative text-left rounded-2xl border p-5 transition-all overflow-hidden ${
              active ? "border-gold shadow-gold bg-gradient-to-br from-gold-soft/60 to-transparent" : "border-border bg-card hover:shadow-lift"
            }`}
          >
            <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${p.accent} opacity-60`} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <Package className="h-5 w-5 text-gold-deep" />
                {active && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex items-center gap-1 rounded-full bg-gradient-gold text-gold-foreground px-2 py-0.5 text-[10px] font-medium">
                    <Check className="h-2.5 w-2.5" /> Appliqué
                  </motion.span>
                )}
              </div>
              <div className="mt-10 font-display text-2xl">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.subtitle}</div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">à partir de</div>
                  <div className="font-display text-xl tabular-nums">{p.price} MAD<span className="text-xs text-muted-foreground"> / pers</span></div>
                </div>
                <div className="text-[11px] text-muted-foreground">{p.items.length} items</div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
