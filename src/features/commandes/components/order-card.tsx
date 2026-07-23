'use client';

import { motion } from 'framer-motion';
import { Calendar, Users, Eye, Pencil, Trash2, ArrowRight, Sparkles, type LucideIcon } from 'lucide-react';
import { useRole } from '@/hooks/use-role';
import { COMMANDE_STATUS_LABELS, COMMANDE_STATUS_STYLES } from '@/features/commandes/constants';
import type { Commande } from '@/features/commandes/types';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

interface OrderCardProps {
  commande: Commande;
  index: number;
  onView: (cmd: Commande) => void;
  onEdit: (cmd: Commande) => void;
  onDelete: (cmd: Commande) => void;
}

function ActionBtn({ icon: Icon, label, onClick, hover }: { icon: LucideIcon; label: string; onClick?: () => void; hover?: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={`flex-1 flex items-center justify-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-2 text-xs font-medium text-muted-foreground/60 transition-all hover:shadow-sm ${hover || 'hover:text-foreground hover:border-foreground/20'}`}
    >
      <Icon className="size-3.5" strokeWidth={1.8} />
      {label}
    </button>
  );
}

export function OrderCard({ commande: cmd, index, onView, onEdit, onDelete }: OrderCardProps) {
  const { can } = useRole();
  const total = Number(cmd.totalAmount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
      className="group rounded-3xl border border-border/60 bg-card shadow-soft hover:shadow-lift transition-all"
    >
      <div className="p-4 sm:p-5">
        {/* Header: order number + client + status badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="size-9 rounded-full bg-gradient-to-br from-[var(--gold-soft)]/20 to-[var(--gold-soft)]/10 border border-[var(--gold-soft)]/30 flex items-center justify-center shrink-0">
              <ArrowRight className="size-4 text-[var(--gold-deep)]/60" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <span className="text-xl font-semibold text-foreground tracking-tight truncate block">{cmd.number}</span>
              <span className="text-sm text-muted-foreground truncate block mt-0.5">{cmd.clientName || 'Client inconnu'}</span>
            </div>
          </div>
          <span className={`text-[11px] px-3 py-1 rounded-full font-semibold shrink-0 ${COMMANDE_STATUS_STYLES[cmd.status] || ''}`}>
            {COMMANDE_STATUS_LABELS[cmd.status] || cmd.status}
          </span>
        </div>

        {/* Second row: event details */}
        {(cmd.eventName || cmd.eventDate || cmd.guestCount) && (
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground w-full min-w-0">
            {cmd.eventName && (
              <span className="flex items-center gap-1.5 min-w-0 flex-1">
                <Sparkles className="size-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
                <span className="truncate">{cmd.eventName}</span>
              </span>
            )}
            {cmd.eventDate && (
              <span className="flex items-center gap-1.5 min-w-0 flex-1">
                <Calendar className="size-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
                <span className="truncate">{new Date(cmd.eventDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </span>
            )}
            {cmd.guestCount && (
              <span className="flex items-center gap-1.5 min-w-0 flex-1">
                <Users className="size-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
                <span className="truncate">{cmd.guestCount} invités</span>
              </span>
            )}
          </div>
        )}

        {/* Third row: total amount */}
        <div className="mt-3">
          <span className="text-lg font-bold tabular-nums text-[var(--gold-deep)] tracking-tight">
            {total > 0 ? mad(total) : '—'}
          </span>
        </div>
      </div>

      {/* Bottom: action buttons */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex items-center gap-1.5">
        <ActionBtn icon={Eye} label="Voir" onClick={() => onView(cmd)} hover="hover:text-[var(--gold-deep)] hover:border-[var(--gold-soft)]/50" />
        {can('commandes', 'update') && (
          <ActionBtn icon={Pencil} label="Modifier" onClick={() => onEdit(cmd)} />
        )}
        {can('commandes', 'delete') && (
          <ActionBtn icon={Trash2} label="Supprimer" onClick={() => onDelete(cmd)} hover="hover:text-red-600 hover:border-red-200" />
        )}
      </div>
    </motion.div>
  );
}
