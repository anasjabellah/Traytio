"use client"

import { FinancialCard } from "./financial-card";

export function DepositStep({ depositPercent, setDepositPercent, total, deposit, remaining }: any) {
  const presets = [20, 30, 50, 100];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mr-2">Acompte</div>
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setDepositPercent(p)}
            className={`px-3 py-1.5 rounded-full text-xs transition ${
              depositPercent === p ? "bg-foreground text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {p}%
          </button>
        ))}
        <input
          type="number"
          value={depositPercent}
          onChange={(e) => setDepositPercent(parseInt(e.target.value) || 0)}
          className="w-20 rounded-full border border-border bg-surface-soft px-3 py-1.5 text-xs text-center focus:outline-none focus:border-gold"
        />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <FinancialCard label="Total" value={total} />
        <FinancialCard label={`Acompte ${depositPercent}%`} value={deposit} highlight />
        <FinancialCard label="Solde restant" value={remaining} muted />
      </div>
    </div>
  );
}
