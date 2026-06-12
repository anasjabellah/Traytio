'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, Utensils, Crown, CalendarIcon, Activity } from 'lucide-react';
import { usePrivacyMode, SensitiveValue } from '@/components/privacy-mode';
import { mad } from '@/features/dashboard/constants';
import type { DashboardData } from '@/features/dashboard/types';

export const BusinessHealth = memo(function BusinessHealth({ health }: { health: DashboardData['health'] }) {
  const { isPrivacyMode } = usePrivacyMode();
  const items = useMemo(() => [
    { label: "Valeur moyenne / \u00e9v\u00e9nement", value: mad(health.avgEventValue), delta: "CA global", icon: TrendingUp, sensitive: true },
    { label: "Acompte moyen", value: mad(health.avgDeposit), delta: health.monthlyGrowth >= 0 ? `+${health.monthlyGrowth}%` : `${health.monthlyGrowth}%`, icon: Wallet, sensitive: true },
    { label: "Menu le plus command\u00e9", value: health.topMenuItem || "Aucun", delta: health.topMenuCount ? `${health.topMenuCount} commandes` : "", icon: Utensils, sensitive: false },
    { label: "Meilleur client", value: health.bestClientName || "Aucun", delta: health.bestClientTotal ? mad(health.bestClientTotal) : "", icon: Crown, sensitive: true },
    { label: "Croissance mensuelle", value: health.monthlyGrowth >= 0 ? `+${health.monthlyGrowth}%` : `${health.monthlyGrowth}%`, delta: "vs mois pr\u00e9c\u00e9dent", icon: Activity, sensitive: true },
    { label: "Nombre total d'\u00e9v\u00e9nements", value: "0", delta: "", icon: CalendarIcon, sensitive: false },
  ], [health]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="mb-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Analytics</div>
        <h3 className="font-display text-2xl mt-1">Sant&eacute; de l'activit&eacute;</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((h, i) => (
          <motion.div key={h.label}
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-border bg-[var(--surface-elevated)] p-4 hover:shadow-soft transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="size-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                <h.icon className="size-3.5" />
              </div>
              {h.delta && <span className="text-[10px] text-emerald-700">{h.delta}</span>}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{h.label}</div>
            <div className="mt-1 text-sm font-medium truncate">
              <SensitiveValue hidden={h.sensitive && isPrivacyMode}>{h.value}</SensitiveValue>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});
