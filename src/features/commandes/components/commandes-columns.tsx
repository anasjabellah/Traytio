'use client';

import { ColumnDef } from '@tanstack/react-table';
import {
  Eye, Pencil, Trash2, Users, FileText, Calendar, ChevronRight,
} from 'lucide-react';
import { COMMANDE_STATUS_LABELS, EVENT_STATUS_LABELS } from '@/features/dashboard/constants';
import type { Commande } from '@/features/commandes/types';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Mariage', CORPORATE: 'Entreprise', BIRTHDAY: 'Anniversaire',
  ANNIVERSARY: 'Gala', HOLIDAY: 'Cocktail', OTHER: 'Privé',
};

const CLIENT_COLORS = [
  'bg-amber-100 text-amber-800', 'bg-emerald-100 text-emerald-800',
  'bg-blue-100 text-blue-800', 'bg-violet-100 text-violet-800',
  'bg-rose-100 text-rose-800', 'bg-cyan-100 text-cyan-800',
  'bg-orange-100 text-orange-800', 'bg-indigo-100 text-indigo-800',
];

const STATUS_DOT_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-400',
  QUOTED: 'bg-blue-500',
  CONFIRMED: 'bg-emerald-500',
  IN_PROGRESS: 'bg-amber-500',
  READY: 'bg-violet-500',
  DELIVERED: 'bg-emerald-700',
  CANCELLED: 'bg-red-500',
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  DRAFT: 'text-gray-500',
  QUOTED: 'text-blue-600',
  CONFIRMED: 'text-emerald-600',
  IN_PROGRESS: 'text-amber-600',
  READY: 'text-violet-600',
  DELIVERED: 'text-emerald-800',
  CANCELLED: 'text-red-600',
};

const EVENT_DOT_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-400',
  PLANNED: 'bg-blue-500',
  CONFIRMED: 'bg-emerald-500',
  IN_PROGRESS: 'bg-amber-500',
  COMPLETED: 'bg-emerald-700',
  CANCELLED: 'bg-red-500',
};

const EVENT_TEXT_COLORS: Record<string, string> = {
  DRAFT: 'text-gray-500',
  PLANNED: 'text-blue-600',
  CONFIRMED: 'text-emerald-600',
  IN_PROGRESS: 'text-amber-600',
  COMPLETED: 'text-emerald-800',
  CANCELLED: 'text-red-600',
};

function hashColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h) + id.charCodeAt(i);
  return CLIENT_COLORS[Math.abs(h) % CLIENT_COLORS.length];
}

function Avatar({ name, id }: { name: string | null; id: string }) {
  const initial = (name ?? '?').charAt(0).toUpperCase();
  return (
    <div className={`size-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ring-2 ring-white shadow-sm ${hashColor(id)}`}>
      {initial}
    </div>
  );
}

function ActionIcons({ cmd, onView, onEdit, onDelete }: {
  cmd: Commande; onView: (c: Commande) => void;
  onEdit: (c: Commande) => void; onDelete: (c: Commande) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => onView(cmd)}
        title="Voir"
        className="p-1.5 rounded-md hover:bg-muted/30 transition-all text-muted-foreground/40 hover:text-[var(--gold-deep)]"
      >
        <Eye className="size-4 shrink-0" strokeWidth={1.8} />
      </button>
      <button
        onClick={() => onEdit(cmd)}
        title="Modifier"
        className="p-1.5 rounded-md hover:bg-muted/30 transition-all text-muted-foreground/40 hover:text-[var(--gold-deep)]"
      >
        <Pencil className="size-4 shrink-0" strokeWidth={1.8} />
      </button>
      <button
        onClick={() => onView(cmd)}
        title="Devis"
        className="p-1.5 rounded-md hover:bg-muted/30 transition-all text-muted-foreground/40 hover:text-[var(--gold-deep)]"
      >
        <FileText className="size-4 shrink-0" strokeWidth={1.8} />
      </button>
      <button
        onClick={() => onDelete(cmd)}
        title="Supprimer"
        className="p-1.5 rounded-md hover:bg-red-50/50 transition-all text-muted-foreground/40 hover:text-red-500"
      >
        <Trash2 className="size-4 shrink-0" strokeWidth={1.8} />
      </button>
    </div>
  );
}

export const commandesColumns = (
  onView: (cmd: Commande) => void,
  onEdit: (cmd: Commande) => void,
  onDelete: (cmd: Commande) => void,
): ColumnDef<Commande>[] => [
  {
    id: 'commande',
    header: 'Commande',
    cell: ({ row }) => {
      const cmd = row.original;
      return (
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/50 flex items-center justify-center shrink-0">
            <ChevronRight className="size-3 text-amber-500/60" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground tracking-tight">{cmd.number}</span>
            {cmd.location && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[120px] leading-tight">{cmd.location}</span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: 'client',
    header: 'Client',
    cell: ({ row }) => {
      const cmd = row.original;
      return (
        <div className="flex items-center gap-2.5">
          <Avatar name={cmd.clientName} id={cmd.clientId} />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-foreground truncate">{cmd.clientName ?? 'Client'}</span>
            {cmd.clientPhone && (
              <span className="text-[11px] text-muted-foreground truncate">{cmd.clientPhone}</span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: 'event',
    header: 'Événement',
    cell: ({ row }) => {
      const cmd = row.original;
      return (
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">
            {cmd.eventName ?? '—'}
          </span>
          {cmd.eventType && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span className="size-1 rounded-full bg-amber-400/60 shrink-0" />
              {EVENT_TYPE_LABELS[cmd.eventType] ?? cmd.eventType}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const cmd = row.original;
      return (
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-muted-foreground/50 shrink-0" strokeWidth={1.5} />
          <span className="text-sm tabular-nums text-foreground/80 whitespace-nowrap">
            {cmd.eventDate
              ? new Date(cmd.eventDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
              : '—'}
          </span>
        </div>
      );
    },
  },
  {
    id: 'guestCount',
    header: 'Invités',
    cell: ({ row }) => {
      const cmd = row.original;
      return (
        <div className="flex items-center gap-1.5">
          <Users className="size-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
          <span className="text-sm tabular-nums font-semibold text-foreground/90">
            {cmd.guestCount ?? '—'}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) => {
      const amount = Number(row.getValue('totalAmount'));
      return (
        <span className="text-sm font-bold tabular-nums text-amber-700 tracking-tight">
          {amount > 0 ? mad(amount) : '—'}
        </span>
      );
    },
  },
  {
    accessorKey: 'eventStatus',
    header: 'Statut',
    cell: ({ row }) => {
      const eventStatus: string | null = row.getValue('eventStatus');
      const dot = EVENT_DOT_COLORS[eventStatus ?? ''] || 'bg-gray-300';
      const text = EVENT_TEXT_COLORS[eventStatus ?? ''] || 'text-gray-400';
      const label = eventStatus ? (EVENT_STATUS_LABELS[eventStatus] || eventStatus) : 'Aucun événement';
      return (
        <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${text}`}>
          {eventStatus && <span className={`size-1.5 rounded-full ${dot}`} />}
          {label}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-center">ACTIONS</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <ActionIcons cmd={row.original} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>
    ),
  },
];
