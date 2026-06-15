"use client"

import { Percent } from "lucide-react";

export function DiscountStep({ discountType, setDiscountType, discountValue, setDiscountValue }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex gap-1 rounded-full border border-border bg-surface-soft p-1 shrink-0">
        {[
          { id: "percent", label: "Pourcentage", icon: <Percent className="h-3.5 w-3.5" /> },
          { id: "fixed", label: "Montant fixe", icon: <span className="text-xs">MAD</span> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setDiscountType(t.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs transition-all ${
              discountType === t.id ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <label className="block group">
          <div className="relative flex items-center rounded-2xl border border-border bg-surface-soft px-4 py-[9px] transition-all focus-within:border-gold focus-within:ring-gold">
            <span className="text-xs text-muted-foreground shrink-0">Valeur de remise</span>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              className="flex-1 bg-transparent text-sm focus:outline-none min-w-0 text-right tabular-nums pr-10"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{discountType === "percent" ? "%" : "MAD"}</span>
          </div>
        </label>
      </div>
    </div>
  );
}
