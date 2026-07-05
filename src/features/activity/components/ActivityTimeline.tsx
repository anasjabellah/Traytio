'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, UserPlus, Calendar, CreditCard, FileText,
  RefreshCw, Activity, Clock,
} from 'lucide-react';
import Link from 'next/link';
import type { ActivityFeedItem, ActivityType } from '@/features/activity/types';

const ICONS: Record<ActivityType, typeof ShoppingCart> = {
  commande_created: ShoppingCart,
  commande_updated: RefreshCw,
  commande_status: RefreshCw,
  payment_received: CreditCard,
  client_created: UserPlus,
  event_created: Calendar,
  invoice_created: FileText,
};

const COLORS: Record<ActivityType, { bg: string; text: string; ring: string }> = {
  commande_created: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-200/50' },
  commande_updated: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-200/50' },
  commande_status: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-200/50' },
  payment_received: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-200/50' },
  client_created: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-200/50' },
  event_created: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-200/50' },
  invoice_created: { bg: 'bg-[var(--gold-soft)]', text: 'text-[var(--gold-deep)]', ring: 'ring-[var(--gold)]/20' },
};

const LABELS: Record<string, string> = {
  commande_created: 'Nouvelle commande',
  commande_updated: 'Commande modifiée',
  commande_status: 'Statut changé',
  payment_received: 'Paiement reçu',
  client_created: 'Nouveau client',
  event_created: 'Nouvel événement',
  invoice_created: 'Nouvelle facture',
};

const ANIMATE_LIMIT = 14;

function groupItems(items: ActivityFeedItem[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - today.getDay() * 86400000);

  const groups: { label: string; test: (d: Date) => boolean }[] = [
    { label: "Aujourd'hui", test: (d) => d >= today },
    { label: 'Hier', test: (d) => d >= yesterday && d < today },
    { label: 'Cette semaine', test: (d) => d >= weekAgo && d < yesterday },
    { label: 'Plus ancien', test: () => true },
  ];

  return groups
    .map((g) => ({ label: g.label, items: items.filter((i) => g.test(i.timestamp)) }))
    .filter((g) => g.items.length > 0);
}

export function ActivityTimeline({
  items,
  search,
  typeFilter,
}: {
  items: ActivityFeedItem[];
  search: string;
  typeFilter: ActivityType | 'all';
}) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (q && !item.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, typeFilter]);

  const groups = useMemo(() => groupItems(filtered), [filtered]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="size-14 rounded-2xl bg-[var(--gold-soft)]/50 flex items-center justify-center mb-4">
          <Activity className="size-7 text-[var(--gold)]/40" strokeWidth={1.2} />
        </div>
        <p className="font-heading text-base text-foreground/70">
          {search || typeFilter !== 'all' ? 'Aucun résultat' : 'Aucune activité'}
        </p>
        <p className="text-xs text-muted-foreground/50 mt-1 max-w-[200px]">
          {search || typeFilter !== 'all'
            ? 'Essayez d\'autres termes ou filtres.'
            : 'Les activités apparaîtront ici.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.label}>
          {/* Group header */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="size-1.5 rounded-full bg-[var(--gold)]/60 shadow-[0_0_4px_rgba(201,169,110,0.25)]" />
            <h3 className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground/60">
              {group.label}
            </h3>
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-[10px] text-muted-foreground/30 tabular-nums font-medium ml-1">
              {group.items.length}
            </span>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-7 top-2 bottom-2 w-px bg-border/40" />

            <div className="space-y-0.5">
              {group.items.map((item, i) => (
                <ActivityRow key={item.id} item={item} index={i} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityRow({ item, index }: { item: ActivityFeedItem; index: number }) {
  const Icon = ICONS[item.type] || Activity;
  const c = COLORS[item.type] || { bg: 'bg-muted', text: 'text-muted-foreground', ring: 'ring-border' };
  const label = LABELS[item.type] || 'Activité';
  const animate = index < ANIMATE_LIMIT;

  const row = (
    <div className="relative flex items-start gap-3 py-2.5 px-3 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-foreground/[0.02] group">
      {/* Icon */}
      <div
        className={`relative z-10 size-8 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset ${c.bg} ${c.text} ${c.ring} transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105`}
      >
        <Icon className="size-3.5" strokeWidth={1.5} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 shrink-0">
            {label}
          </span>
          <span className="size-0.5 rounded-full bg-muted-foreground/20 shrink-0" />
          <span className="text-[10px] text-muted-foreground/40">{item.timeAgo}</span>
        </div>
        <p className="text-sm leading-snug text-foreground/85 mt-0.5 line-clamp-2">
          {item.description}
        </p>
        {item.entityLabel && (
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="size-2.5 text-muted-foreground/30 shrink-0" />
            <span className="text-[11px] text-muted-foreground/40 truncate">{item.entityLabel}</span>
          </div>
        )}
      </div>

      {/* Action link */}
      {item.entityId && item.entityType && item.entityType !== 'payment' && (
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] shrink-0 self-center">
          <span className="inline-flex items-center text-[10px] font-medium text-[var(--gold-deep)] bg-[var(--gold-soft)]/50 rounded px-1.5 py-0.5">
            Voir
          </span>
        </div>
      )}
    </div>
  );

  if (item.entityId && item.entityType && item.entityType !== 'payment') {
    const href = hrefForEntity(item.entityType, item.entityId);
    if (href) {
      const wrapped = (
        <Link href={href} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]/50">
          {row}
        </Link>
      );
      if (animate) {
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.02, 0.28), type: 'spring', stiffness: 80, damping: 20 }}>
            {wrapped}
          </motion.div>
        );
      }
      return wrapped;
    }
  }

  if (animate) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.02, 0.28), type: 'spring', stiffness: 80, damping: 20 }}>
        {row}
      </motion.div>
    );
  }

  return row;
}

function hrefForEntity(type: string | null, id: string): string | null {
  if (!type) return null;
  switch (type) {
    case 'commande': return `/dashboard/commandes/${id}`;
    case 'client': return `/dashboard/clients/${id}`;
    case 'event': return `/dashboard/events/${id}`;
    case 'invoice': return `/dashboard/invoices/${id}`;
    default: return null;
  }
}
