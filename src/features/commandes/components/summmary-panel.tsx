"use client"

import { motion, AnimatePresence } from "framer-motion";
import { Package } from "lucide-react";

type Client = any;

function Row({ label, value, muted, accent }: { label: string; value: number; muted?: boolean; accent?: string }) {
  return (
    <div className={`flex items-center justify-between ${muted ? "text-muted-foreground" : ""} ${accent || ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value.toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD</span>
    </div>
  );
}

export function SummaryPanel(props: {
  client: Client; eventName: string; eventDate: string; guests: number;
  packName?: string; selectedList: any[]; itemsSubtotal: number; extrasTotal: number;
  discountAmount: number; total: number; deposit: number; remaining: number;
  budget: number; budgetUsed: number; overBudget: boolean;
}) {
  const {
    client, eventName, eventDate, guests, packName, selectedList,
    itemsSubtotal, extrasTotal, discountAmount, total, deposit, remaining,
    budget, budgetUsed, overBudget,
  } = props;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-[1.75rem] glass shadow-glass overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-mesh opacity-50 pointer-events-none" />
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Résumé en direct</div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
          </span>
        </div>

        <div className="mt-3 font-display text-2xl leading-tight">{eventName || "Nouvel événement"}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {client?.name || "Aucun client"} · {new Date(eventDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {guests} pax
        </div>
        {packName && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-gold text-gold-foreground px-2.5 py-0.5 text-[10px] font-medium">
            <Package className="h-2.5 w-2.5" /> {packName}
          </div>
        )}

        <div className="mt-5 max-h-[200px] overflow-auto pr-1 space-y-1.5">
          <AnimatePresence>
            {selectedList.length === 0 && (
              <div className="text-xs text-muted-foreground py-4 text-center">Aucun article sélectionné.</div>
            )}
            {selectedList.map((s: any) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span>{s.item.emoji}</span>
                  <span className="truncate">{s.item.name}</span>
                  <span className="text-muted-foreground tabular-nums">×{s.qty}</span>
                </div>
                <span className="tabular-nums">{(s.item.price * s.qty).toLocaleString("fr-MA")} MAD</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-5 pt-5 border-t border-border space-y-2 text-xs">
          <Row label="Articles" value={itemsSubtotal} />
          <Row label="Frais supplémentaires" value={extrasTotal} />
          {discountAmount > 0 && <Row label="Remise" value={-discountAmount} accent="text-emerald-700" />}
          <div className="flex items-end justify-between pt-3">
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Total</span>
            <motion.span key={total} initial={{ y: -3, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-3xl tabular-nums">
              {total.toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD
            </motion.span>
          </div>
          <Row label="Acompte" value={deposit} muted />
          <Row label="Solde restant" value={remaining} muted />
        </div>

        {budget > 0 && (
          <div className="mt-5 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-xs">
              <div className="text-muted-foreground">Budget client</div>
              <div className="tabular-nums">{total.toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD / {budget.toLocaleString("fr-MA")} MAD</div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={false}
                animate={{ width: `${budgetUsed}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className={`h-full ${overBudget ? "bg-destructive" : "bg-gradient-gold"}`}
              />
            </div>
            <div className={`mt-2 text-[11px] ${overBudget ? "text-destructive" : "text-muted-foreground"}`}>
              {overBudget
                ? `Dépassement de ${(total - budget).toLocaleString("fr-MA")} MAD`
                : `Reste ${(budget - total).toLocaleString("fr-MA")} MAD sur le budget`}
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
