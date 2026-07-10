'use client';

import { ColumnDef } from '@tanstack/react-table';
import {
  Eye, Pencil, Trash2, FileText, Calendar, ChevronRight,
} from 'lucide-react';
import { useRole } from '@/hooks/use-role';
import { COMMANDE_STATUS_LABELS, EVENT_STATUS_LABELS } from '@/features/dashboard/constants';
import type { Commande } from '@/features/commandes/types';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Mariage', CORPORATE: 'Entreprise', BIRTHDAY: 'Anniversaire',
  ANNIVERSARY: 'Gala', HOLIDAY: 'Cocktail', OTHER: 'Privé',
};

const CLIENT_COLORS = [
  'bg-[var(--gold-soft)]/30 text-[var(--gold-deep)]', 'bg-emerald-100 text-emerald-800',
  'bg-blue-100 text-blue-800', 'bg-violet-100 text-violet-800',
  'bg-rose-100 text-rose-800', 'bg-cyan-100 text-cyan-800',
  'bg-indigo-100 text-indigo-800', 'bg-stone-100 text-stone-800',
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

function TableIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 491.413 491.413" fill="currentColor" className={className}>
      <path d="M491.413,133.867c0-62.4-126.613-96.107-245.653-96.107S0,71.467,0,133.867c0,60.48,118.72,93.973,234.453,96v125.76c-0.213,0.747-0.533,1.387-0.853,2.133c-4.587,0.32-8.533,3.52-9.6,8.107c-1.173,4.16-2.773,8.107-4.8,11.947c-1.067,0.533-2.24,0.853-3.413,1.067c-12.373,1.6-30.08-17.707-36.693-27.307c-3.307-4.907-10.027-6.08-14.827-2.773s-6.08,10.027-2.773,14.827c2.347,3.413,20.373,29.013,42.987,35.2c-13.013,14.08-34.027,28.373-67.84,33.6c-5.867,0.853-9.813,6.293-8.96,12.16c0.747,5.227,5.333,9.067,10.56,9.067c0.533,0,1.067,0,1.6-0.107c56.853-8.64,83.733-39.68,95.787-61.227c3.627-3.093,6.827-6.613,9.387-10.667c2.56,3.947,5.76,7.573,9.387,10.667c12.16,21.547,39.04,52.587,95.893,61.227c0.533,0.107,1.067,0.107,1.6,0.107c5.867,0,10.667-4.8,10.667-10.667c0-5.333-3.84-9.813-9.067-10.56c-33.92-5.227-55.04-19.52-67.947-33.6c22.613-6.293,40.747-31.893,43.093-35.307c3.307-4.8,2.133-11.52-2.667-14.827s-11.52-2.133-14.827,2.773c-6.72,9.6-24.213,28.907-36.693,27.307c-1.173-0.213-2.347-0.533-3.413-1.067c-2.027-3.84-3.627-7.787-4.8-11.947c-1.173-4.587-5.12-7.787-9.707-8.107c-5.44-0.32-9.067-0.533-10.56-2.133v-125.76C372.693,227.84,491.413,194.347,491.413,133.867z M245.76,211.733c-113.173,0-192.853-31.04-204.8-77.867c11.947-46.827,91.627-77.867,204.8-77.867s192.853,31.04,204.8,77.867C438.613,180.693,358.933,211.733,245.76,211.733z" />
    </svg>
  );
}

function ActionIcons({ cmd, onView, onEdit, onDelete }: {
  cmd: Commande; onView: (c: Commande) => void;
  onEdit: (c: Commande) => void; onDelete: (c: Commande) => void;
}) {
  const { can } = useRole();
  return (
    <div className="flex items-center gap-0.5 whitespace-nowrap">
      <button
        onClick={() => onView(cmd)}
        title="Voir"
        className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:p-1.5 rounded-md hover:bg-muted/30 transition-all text-muted-foreground/40 hover:text-[var(--gold-deep)]"
      >
        <Eye className="size-4 shrink-0" strokeWidth={1.8} />
      </button>
      {can('commandes', 'update') && (
        <button
          onClick={() => onEdit(cmd)}
          title="Modifier"
          className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:p-1.5 rounded-md hover:bg-muted/30 transition-all text-muted-foreground/40 hover:text-[var(--gold-deep)]"
        >
          <Pencil className="size-4 shrink-0" strokeWidth={1.8} />
        </button>
      )}
      {can('invoices', 'create') && (
        <button
          onClick={() => onView(cmd)}
          title="Devis"
          className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:p-1.5 rounded-md hover:bg-muted/30 transition-all text-muted-foreground/40 hover:text-[var(--gold-deep)]"
        >
          <FileText className="size-4 shrink-0" strokeWidth={1.8} />
        </button>
      )}
      {can('commandes', 'delete') && (
        <button
          onClick={() => onDelete(cmd)}
          title="Supprimer"
          className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:p-1.5 rounded-md hover:bg-red-50/50 transition-all text-muted-foreground/40 hover:text-red-500"
        >
          <Trash2 className="size-4 shrink-0" strokeWidth={1.8} />
        </button>
      )}
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
          <div className="size-7 rounded-lg bg-gradient-to-br from-[var(--gold-soft)]/20 to-[var(--gold-soft)]/10 border border-[var(--gold-soft)]/40 flex items-center justify-center shrink-0">
            <ChevronRight className="size-3 text-[var(--gold-deep)]/60" strokeWidth={2.5} />
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
              <span className="size-1 rounded-full bg-[var(--gold-deep)]/60 shrink-0" />
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
    header: 'Tables',
    cell: ({ row }) => {
      const cmd = row.original;
      return (
        <div className="flex items-center gap-1.5">
          <TableIcon className="size-3.5 text-muted-foreground/40 shrink-0" />
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
        <span className="text-sm font-bold tabular-nums text-[var(--gold-deep)] tracking-tight">
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
