"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, StickyNote } from "lucide-react";
import { type MenuItem, type SelectedItem } from "@/features/commandes/data/mock-data";

export function ItemCard({
  item, state, onToggle, onQty, onNote,
}: {
  item: MenuItem; state?: SelectedItem;
  onToggle: () => void; onQty: (n: number) => void; onNote: (n: string) => void;
}) {
  const qty = state?.qty || 0;
  const active = qty > 0;
  const [showNote, setShowNote] = useState(false);
  const lineTotal = item.price * qty;

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={`relative rounded-2xl border p-4 transition-all ${
        active
          ? "border-gold bg-gradient-to-br from-gold-soft/40 to-transparent shadow-soft"
          : "border-border bg-card hover:border-foreground/20 hover:shadow-soft"
      }`}
    >
      {item.tag && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-gradient-gold text-gold-foreground px-2 py-0.5 text-[10px] font-medium">
          {item.tag}
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 shrink-0 rounded-xl bg-surface-soft border border-border flex items-center justify-center text-3xl">
          {item.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{item.name}</div>
          <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</div>
          <div className="text-xs text-muted-foreground mt-1.5 tabular-nums">{item.price} MAD · unité</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key="qty"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card p-0.5"
            >
              <button onClick={() => onQty(qty - 5)} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center">
                <Minus className="h-3 w-3" />
              </button>
              <motion.span key={qty} initial={{ y: -2, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-xs font-medium w-10 text-center tabular-nums">
                {qty}
              </motion.span>
              <button onClick={() => onQty(qty + 5)} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center">
                <Plus className="h-3 w-3" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="add"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onToggle}
              className="inline-flex items-center gap-1 rounded-full bg-foreground text-primary-foreground px-3 py-1.5 text-xs"
            >
              <Plus className="h-3 w-3" /> Ajouter
            </motion.button>
          )}
        </AnimatePresence>
        {active && (
          <motion.div key={lineTotal} initial={{ y: -3, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-lg tabular-nums">
            {lineTotal.toLocaleString("fr-MA")} MAD
          </motion.div>
        )}
      </div>

      {active && (
        <motion.div layout className="mt-3 pt-3 border-t border-border/60">
          <button
            onClick={() => setShowNote(!showNote)}
            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <StickyNote className="h-3 w-3" /> {state?.note ? "Modifier la note" : "Ajouter une note spéciale"}
          </button>
          <AnimatePresence>
            {showNote && (
              <motion.input
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                value={state?.note || ""}
                onChange={(e) => onNote(e.target.value)}
                placeholder="Sans amandes, dressage VIP…"
                className="mt-2 w-full rounded-xl border border-border bg-surface-soft px-3 py-2 text-xs focus:outline-none focus:border-gold"
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
