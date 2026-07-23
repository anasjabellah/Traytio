"use client"

import { type Dispatch, type SetStateAction } from "react";
import { FinancialCard } from "./financial-card";

export function DepositStep({ acompteAmount, setAcompteAmount, total, remaining }: {
  acompteAmount: number; setAcompteAmount: Dispatch<SetStateAction<number>>;
  total: number; deposit: number; remaining: number;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-foreground/60 mb-2">
          Acompte demandé
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0"
            value={acompteAmount}
            onChange={(e) => setAcompteAmount(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="w-full h-11 rounded-xl border border-border bg-white px-4 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-[var(--gold-deep)]/20 focus:border-[var(--gold-deep)]/40 tabular-nums transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-foreground/50 font-semibold">
            MAD
          </span>
        </div>
        <p className="text-xs text-foreground/50 mt-1.5">
          Montant minimum demandé au client avant confirmation.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <FinancialCard label="Total" value={total} />
        <FinancialCard label="Acompte" value={acompteAmount} highlight />
        <FinancialCard label="Solde restant" value={remaining} muted />
      </div>
    </div>
  );
}
