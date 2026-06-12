'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { usePrivacyMode, SensitiveValue } from '@/components/privacy-mode';
import { STATUS_STYLES, COMMANDE_STATUS_LABELS, mad } from '@/features/dashboard/constants';
import type { DashboardData } from '@/features/dashboard/types';

export const RecentCommandes = memo(function RecentCommandes({ commandes }: { commandes: DashboardData['recentCommandes'] }) {
  const { isPrivacyMode } = usePrivacyMode();
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Activit&eacute;</div>
          <h3 className="font-display text-2xl mt-1">Commandes r&eacute;centes</h3>
        </div>
        <button className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          Voir tout <ArrowRight className="size-3" />
        </button>
      </div>
      <div className="divide-y divide-border">
        <div className="grid grid-cols-12 px-6 py-3 text-[10px] uppercase tracking-wider text-muted-foreground bg-foreground/[0.02]">
          <div className="col-span-3">Commande</div>
          <div className="col-span-3">Client</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-2 text-right">Statut</div>
        </div>
        {commandes.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Aucune commande r&eacute;cente</div>
        )}
        {commandes.map((c, i) => (
          <motion.div key={c.id}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
            className="grid grid-cols-12 items-center px-6 py-4 hover:bg-foreground/[0.02] transition-colors group cursor-pointer">
            <div className="col-span-3 text-sm font-medium tabular-nums">{c.number}</div>
            <div className="col-span-3 flex items-center gap-2 text-sm truncate">
              <div className="size-7 rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center text-[10px] font-medium shrink-0">
                {c.clientName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <span className="truncate">{c.clientName}</span>
            </div>
            <div className="col-span-2 text-sm text-muted-foreground">
              {new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </div>
            <div className="col-span-2 text-sm font-medium text-right tabular-nums">
              <SensitiveValue hidden={isPrivacyMode}>{mad(c.total)}</SensitiveValue>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-2">
              <span className={`whitespace-nowrap text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLES[COMMANDE_STATUS_LABELS[c.status]] || 'bg-foreground/[0.05]'}`}>
                {COMMANDE_STATUS_LABELS[c.status] || c.status}
              </span>
              <ChevronRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});
