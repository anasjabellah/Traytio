'use client';

import { OrderCard } from './order-card';
import type { Commande } from '@/features/commandes/types';

interface CommandesGridProps {
  data: Commande[];
  loading: boolean;
  onView: (cmd: Commande) => void;
  onEdit: (cmd: Commande) => void;
  onDelete: (cmd: Commande) => void;
}

export function CommandesGrid({ data, loading, onView, onEdit, onDelete }: CommandesGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card shadow-soft p-5 animate-pulse space-y-3">
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
            <div className="flex justify-between">
              <div className="h-3 w-1/4 bg-muted rounded" />
              <div className="h-3 w-1/4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
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
