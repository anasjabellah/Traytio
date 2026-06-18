'use client';

import { motion } from 'framer-motion';
import { Eye, Pencil, Trash2, Calendar, Users, MapPin, ArrowUpRight } from 'lucide-react';
import { COMMANDE_STATUS_LABELS, COMMANDE_STATUS_STYLES } from '@/features/commandes/constants';
import type { Commande } from '@/features/commandes/types';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Mariage',
  CORPORATE: 'Corporate',
  BIRTHDAY: 'Anniversaire',
  ANNIVERSARY: 'Anniversaire de mariage',
  HOLIDAY: 'Fête',
  OTHER: 'Autre',
};

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card shadow-soft p-5 animate-pulse">
            <div className="h-4 w-3/4 bg-muted rounded mb-3" />
            <div className="h-3 w-1/2 bg-muted rounded mb-2" />
            <div className="h-3 w-2/3 bg-muted rounded mb-4" />
            <div className="h-8 w-full bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((cmd, index) => {
        const total = Number(cmd.totalAmount);
        const remaining = Number(cmd.remainingAmount);
        const pct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;

        return (
          <motion.div
            key={cmd.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.025, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="group rounded-2xl border border-border bg-card shadow-soft hover:shadow-md transition-all overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold mb-0.5">
                    {cmd.number}
                  </div>
                  <h3 className="font-display text-base truncate group-hover:text-[var(--gold-deep)] transition-colors">
                    {cmd.clientName || 'Client inconnu'}
                  </h3>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground/20 group-hover:text-[var(--gold-deep)] transition-colors shrink-0 mt-1" />
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground/70 mb-4">
                {cmd.eventDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5 text-muted-foreground/40" strokeWidth={1.5} />
                    {new Date(cmd.eventDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
                {cmd.eventType && (
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5 text-muted-foreground/40" strokeWidth={1.5} />
                    {EVENT_TYPE_LABELS[cmd.eventType] || cmd.eventType}
                  </span>
                )}
                {cmd.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-muted-foreground/40" strokeWidth={1.5} />
                    {cmd.location}
                  </span>
                )}
                {cmd.guestCount && (
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5 text-muted-foreground/40" strokeWidth={1.5} />
                    {cmd.guestCount} invités
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold tracking-tight tabular-nums">
                  {mad(total)}
                </span>
                <span className={`text-[11px] px-3 py-1 rounded-full font-semibold ${COMMANDE_STATUS_STYLES[cmd.status] || 'bg-foreground/[0.05] text-muted-foreground'}`}>
                  {COMMANDE_STATUS_LABELS[cmd.status] || cmd.status}
                </span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--gold-deep)]/60 transition-all"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-1">
                <span>Payé: {mad(total - remaining)}</span>
                <span>Restant: {mad(remaining)}</span>
              </div>
            </div>

            <div className="border-t border-border/10 px-5 py-2.5 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="size-7 rounded-md hover:bg-muted/50 transition-all flex items-center justify-center text-muted-foreground/40 hover:text-foreground"
                title="Voir"
                onClick={(e) => { e.stopPropagation(); onView(cmd); }}
              >
                <Eye className="size-3.5" strokeWidth={1.8} />
              </button>
              <button
                className="size-7 rounded-md hover:bg-muted/50 transition-all flex items-center justify-center text-muted-foreground/40 hover:text-foreground"
                title="Modifier"
                onClick={(e) => { e.stopPropagation(); onEdit(cmd); }}
              >
                <Pencil className="size-3.5" strokeWidth={1.8} />
              </button>
              <button
                className="size-7 rounded-md hover:bg-muted/50 transition-all flex items-center justify-center text-muted-foreground/40 hover:text-red-600"
                title="Supprimer"
                onClick={(e) => { e.stopPropagation(); onDelete(cmd); }}
              >
                <Trash2 className="size-3.5" strokeWidth={1.8} />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
