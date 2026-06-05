"use client"

import { motion } from "framer-motion";

export function FinancialCard({ label, value, highlight, muted }: { label: string; value: number; highlight?: boolean; muted?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${
      highlight
        ? "bg-gradient-to-br from-gold-soft/60 to-transparent border border-gold/40 shadow-gold"
        : muted
        ? "bg-surface-soft border border-border"
        : "bg-card border border-border"
    }`}>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <motion.div key={value} initial={{ y: -3, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-2 font-display text-3xl tabular-nums">
        {value.toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD
      </motion.div>
    </div>
  );
}
