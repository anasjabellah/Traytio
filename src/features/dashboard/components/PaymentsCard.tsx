'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrivacyMode, SensitiveValue } from '@/components/privacy-mode';
import { mad } from '@/features/dashboard/constants';

export const PaymentsCard = memo(function PaymentsCard({ paid, pending, remaining }: { paid: number; pending: number; remaining: number }) {
  const { isPrivacyMode } = usePrivacyMode();
  const total = paid + pending + remaining;
  const pct = (n: number) => Math.round((n / Math.max(1, total)) * 100);
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Paiements</div>
          <h3 className="font-display text-2xl mt-1">Suivi financier</h3>
        </div>
        <Wallet className="size-5 text-muted-foreground" />
      </div>

      <div className="mt-6 h-3 w-full rounded-full bg-foreground/[0.05] overflow-hidden flex">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct(paid)}%` }} transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct(pending)}%` }} transition={{ duration: 1, delay: 0.2 }}
          className="h-full bg-gradient-gold" />
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct(remaining)}%` }} transition={{ duration: 1, delay: 0.4 }}
          className="h-full bg-foreground/20" />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        <SensitiveValue hidden={isPrivacyMode}>{pct(paid)}% encaiss&eacute; sur {mad(total)}</SensitiveValue>
      </div>

      <div className="mt-6 space-y-4">
        {[
          { label: "Pay\u00e9s", value: paid, color: "bg-emerald-500" },
          { label: "En attente", value: pending, color: "bg-[var(--gold-deep)]" },
          { label: "Restant d\u00fb", value: remaining, color: "bg-foreground/40" },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className={`size-2 rounded-full ${r.color}`} />
              {r.label}
            </div>
            <div className="text-sm font-medium tabular-nums"><SensitiveValue hidden={isPrivacyMode}>{mad(r.value)}</SensitiveValue></div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="mt-6 w-full h-9 rounded-lg">
        Relancer les paiements <ArrowUpRight className="size-3.5" />
      </Button>
    </div>
  );
});
