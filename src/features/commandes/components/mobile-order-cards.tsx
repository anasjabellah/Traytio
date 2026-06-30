'use client';

import { ShoppingBag, Plus } from 'lucide-react';
import { OrderCard } from './order-card';
import type { Commande } from '@/features/commandes/types';

interface MobileOrderCardsProps {
  data: Commande[];
  loading: boolean;
  onView: (cmd: Commande) => void;
  onEdit: (cmd: Commande) => void;
  onDelete: (cmd: Commande) => void;
}

export function MobileOrderCards({ data, loading, onView, onEdit, onDelete }: MobileOrderCardsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft animate-pulse space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-2/3 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-3/4 bg-muted rounded" />
            <div className="h-5 w-1/3 bg-muted rounded" />
            <div className="h-1.5 w-full bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-10 flex flex-col items-center gap-5 text-center">
        <div className="size-14 rounded-2xl bg-gradient-to-br from-[var(--gold-soft)]/20 to-[var(--gold-soft)]/10 border border-[var(--gold-soft)]/40 flex items-center justify-center shadow-sm">
          <ShoppingBag className="size-6 text-[var(--gold-deep)]/60" strokeWidth={1.5} />
        </div>
        <div className="max-w-[240px]">
          <p className="text-base font-semibold text-foreground">Aucune commande</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Créez votre première commande pour commencer.
          </p>
        </div>
        <a
          href="/dashboard/commandes/new"
          className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background rounded-xl px-5 py-2.5 text-sm font-medium transition-all shadow-sm"
        >
          <Plus className="size-4" strokeWidth={1.8} />
          Nouvelle commande
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((cmd, index) => (
        <OrderCard
          key={cmd.id}
          commande={cmd}
          index={index}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
