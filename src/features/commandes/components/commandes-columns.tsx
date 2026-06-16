'use client';

import { ColumnDef } from '@tanstack/react-table';
import {
  Eye, Pencil, Trash2, Calendar, Users,
} from 'lucide-react';
import { COMMANDE_STATUS_LABELS, COMMANDE_STATUS_STYLES } from '@/features/commandes/constants';
import type { Commande } from '@/features/commandes/types';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

function ReferenceCell({ number }: { number: string }) {
  return (
    <span className="font-semibold text-sm text-foreground tabular-nums">{number}</span>
  );
}

function ClientCell({ name }: { name: string | null }) {
  return (
    <span className="text-sm text-foreground truncate block">{name ?? '—'}</span>
  );
}

function TotalCell({ amount }: { amount: number }) {
  return (
    <span className="text-sm font-bold tabular-nums text-foreground tracking-tight">
      {amount > 0 ? mad(amount) : '—'}
    </span>
  );
}

function StatusCell({ status }: { status: string }) {
  return (
    <span className={`text-[11px] px-3 py-1 rounded-full font-semibold inline-block ${COMMANDE_STATUS_STYLES[status] || 'bg-foreground/[0.05] text-muted-foreground'}`}>
      {COMMANDE_STATUS_LABELS[status] || status}
    </span>
  );
}

function DateCell({ date }: { date: Date | null | undefined }) {
  if (!date) return <span className="text-muted-foreground/30 text-sm">—</span>;
  return (
    <span className="text-sm text-muted-foreground/80 whitespace-nowrap tabular-nums">
      {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
    </span>
  );
}

function GuestCell({ count }: { count: number | null }) {
  if (!count) return <span className="text-muted-foreground/30 text-sm">—</span>;
  return (
    <span className="text-sm text-foreground/80 tabular-nums">{count}</span>
  );
}

function AmountCell({ amount }: { amount: number }) {
  return (
    <span className={`text-sm tabular-nums ${amount > 0 ? 'text-foreground/80' : 'text-muted-foreground/30'}`}>
      {amount > 0 ? mad(amount) : '—'}
    </span>
  );
}

export const commandesColumns = (
  onView: (cmd: Commande) => void,
  onEdit: (cmd: Commande) => void,
  onDelete: (cmd: Commande) => void,
): ColumnDef<Commande>[] => [
  {
    accessorKey: 'number',
    header: 'Référence',
    cell: ({ row }) => <ReferenceCell number={row.getValue('number')} />,
  },
  {
    id: 'client',
    header: 'Client',
    cell: ({ row }) => <ClientCell name={row.original.clientName} />,
  },
  {
    id: 'eventDate',
    header: 'Date événement',
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Calendar className="size-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
        <DateCell date={row.original.eventDate} />
      </div>
    ),
  },
  {
    id: 'guestCount',
    header: 'Invités',
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Users className="size-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
        <GuestCell count={row.original.guestCount} />
      </div>
    ),
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) => <TotalCell amount={Number(row.getValue('totalAmount'))} />,
  },
  {
    id: 'acompteAmount',
    header: 'Acompte',
    cell: ({ row }) => <AmountCell amount={Number(row.original.acompteAmount)} />,
  },
  {
    id: 'remainingAmount',
    header: 'Solde',
    cell: ({ row }) => <AmountCell amount={Number(row.original.remainingAmount)} />,
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => <StatusCell status={row.getValue('status')} />,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const cmd = row.original;
      const b = 'size-7 rounded-md hover:bg-muted/50 transition-all flex items-center justify-center text-muted-foreground/40 hover:text-foreground';
      return (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button className={b} title="Voir" onClick={() => onView(cmd)}>
            <Eye className="size-3.5" strokeWidth={1.8} />
          </button>
          <button className={b} title="Modifier" onClick={() => onEdit(cmd)}>
            <Pencil className="size-3.5" strokeWidth={1.8} />
          </button>
          <button className={`${b} hover:text-red-600`} title="Supprimer" onClick={() => onDelete(cmd)}>
            <Trash2 className="size-3.5" strokeWidth={1.8} />
          </button>
        </div>
      );
    },
  },
];
