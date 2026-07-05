'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ActivityType } from '@/features/activity/types';

const FILTERS: { value: ActivityType | 'all'; label: string; dot?: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'commande_created', label: 'Commandes', dot: 'bg-blue-500' },
  { value: 'commande_status', label: 'Statuts', dot: 'bg-sky-500' },
  { value: 'payment_received', label: 'Paiements', dot: 'bg-emerald-500' },
  { value: 'client_created', label: 'Clients', dot: 'bg-amber-500' },
  { value: 'event_created', label: 'Événements', dot: 'bg-violet-500' },
  { value: 'invoice_created', label: 'Factures', dot: 'bg-[var(--gold)]' },
];

const ACTIVE: Record<string, string> = {
  all: 'bg-gradient-gold text-white shadow-[0_2px_8px_rgba(201,168,76,0.3)]',
  commande_created: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  commande_status: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60',
  payment_received: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  client_created: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  event_created: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60',
  invoice_created: 'bg-[var(--gold-soft)] text-[var(--gold-deep)] ring-1 ring-[var(--gold)]/20',
};

export function ActivityFilters({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: ActivityType | 'all';
  onTypeFilterChange: (v: ActivityType | 'all') => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex items-center gap-2 px-4 h-11 rounded-xl border border-border bg-card shadow-soft w-full lg:flex-1 lg:max-w-[400px] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/30">
        <Search className="size-4 text-muted-foreground shrink-0" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher dans l'activité..."
          className="h-auto min-w-0 flex-1 bg-transparent px-0 py-0 text-sm border-0 shadow-none outline-none focus-visible:ring-0 focus-visible:border-0 placeholder:text-muted-foreground"
          aria-label="Rechercher"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="size-5 rounded-full hover:bg-secondary flex items-center justify-center shrink-0 transition-colors"
            aria-label="Effacer la recherche"
          >
            <X className="size-3 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((opt) => {
          const isActive = typeFilter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onTypeFilterChange(opt.value)}
              className={cn(
                'h-8 rounded-lg px-2.5 text-xs font-medium whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
                isActive
                  ? ACTIVE[opt.value]
                  : 'bg-muted/30 text-muted-foreground/60 ring-1 ring-border/30 hover:ring-border/60 hover:text-foreground/80'
              )}
            >
              {opt.dot && (
                <span className={cn('inline-block size-1.5 rounded-full mr-1.5 align-middle', opt.dot)} />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
