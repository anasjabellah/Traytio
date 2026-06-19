"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Check, ChevronDown, ChevronUp } from "lucide-react";

type Pack = { id: string; name: string; subtitle: string; price: number; items: string[]; accent: string };

export function PackStep({ packs, selectedPack, onSelect }: { packs: Pack[]; selectedPack: string | null; onSelect: (id: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? packs : packs.slice(0, 3);
  const hasMore = packs.length > 3;

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-4">
        <AnimatePresence>
          {visible.map((p) => {
            const active = selectedPack === p.id;
            return (
              <motion.button
                key={p.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
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
                  <div className="text-xs text-muted-foreground line-clamp-2">{p.subtitle}</div>
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
        </AnimatePresence>
      </div>
      {hasMore && (
        <div className="flex justify-center mt-5">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAll ? (
              <>Voir moins <ChevronUp className="size-3.5" /></>
            ) : (
              <>Voir plus ({packs.length - 3} masqués) <ChevronDown className="size-3.5" /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
