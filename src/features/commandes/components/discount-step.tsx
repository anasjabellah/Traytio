"use client"

import { Percent } from "lucide-react";
import { PremiumField } from "./premium-field";

export function DiscountStep({ discountType, setDiscountType, discountValue, setDiscountValue }: any) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex gap-1 rounded-full border border-border bg-surface-soft p-1 self-start">
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
      <div className="flex-1">
        <PremiumField
          label="Valeur de remise"
          value={discountValue}
          onChange={(v) => setDiscountValue(parseFloat(v) || 0)}
          type="number"
          suffix={discountType === "percent" ? "%" : "MAD"}
        />
      </div>
    </div>
  );
}
