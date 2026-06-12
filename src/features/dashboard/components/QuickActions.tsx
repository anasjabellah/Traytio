'use client';

import { memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { ACTIONS } from '@/features/dashboard/constants';

export const QuickActions = memo(function QuickActions() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="mb-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Raccourcis</div>
        <h3 className="font-display text-2xl mt-1">Actions rapides</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          const inner = (
            <motion.div whileHover={{ y: -3 }}
              className={`group h-full rounded-xl border p-4 flex flex-col items-start gap-3 transition-all cursor-pointer
                ${a.primary ? "border-gold bg-gradient-to-br from-[var(--gold-soft)]/50 to-transparent hover:shadow-gold" : "border-border bg-[var(--surface-elevated)] hover:shadow-soft"}`}>
              <div className={`size-9 rounded-lg flex items-center justify-center ${a.primary ? "bg-gradient-charcoal text-white" : "bg-foreground/[0.04]"}`}>
                <Icon className="size-4" />
              </div>
              <div className="text-sm font-medium">{a.label}</div>
              <ArrowUpRight className="size-3.5 text-muted-foreground ml-auto -mt-2 opacity-0 group-hover:opacity-100 transition" />
            </motion.div>
          );
          return a.to ? <Link key={a.label} href={a.to}>{inner}</Link> : <div key={a.label}>{inner}</div>;
        })}
      </div>
    </div>
  );
});
