'use client';

import { ColumnDef } from '@tanstack/react-table';
import {
  Eye, Pencil, Trash2,
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

function EventCell({ name }: { name: string | null }) {
  if (!name) return <span className="text-muted-foreground/30 text-sm">—</span>;
  return <span className="text-sm text-foreground/70 truncate block">{name}</span>;
}

function TotalCell({ amount }: { amount: number }) {
  return (
    <span className="text-sm font-semibold tabular-nums text-foreground">
      {amount > 0 ? mad(amount) : '—'}
    </span>
  );
}

function StatusCell({ status }: { status: string }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block ${COMMANDE_STATUS_STYLES[status] || 'bg-foreground/[0.05] text-muted-foreground'}`}>
      {COMMANDE_STATUS_LABELS[status] || status}
    </span>
  );
}

function DateCell({ date }: { date: Date }) {
  return (
    <span className="text-sm text-muted-foreground/70 whitespace-nowrap tabular-nums">
      {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
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
    id: 'event',
    header: 'Événement',
    cell: ({ row }) => <EventCell name={row.original.eventName} />,
  },
  {
    id: 'menuName',
    header: 'Pack/Menu',
    cell: ({ row }) => {
      const name = row.original.menuName;
      return name ? (
        <span className="text-sm text-foreground/70 truncate block">{name}</span>
      ) : (
        <span className="text-muted-foreground/30 text-sm">—</span>
      );
    },
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) => <TotalCell amount={Number(row.getValue('totalAmount'))} />,
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => <StatusCell status={row.getValue('status')} />,
  },
  {
    accessorKey: 'createdAt',
    header: 'Créé le',
    cell: ({ row }) => <DateCell date={row.getValue('createdAt') as Date} />,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const cmd = row.original;
      const b = 'size-7 rounded-md hover:bg-muted/50 transition-all flex items-center justify-center text-muted-foreground/40 hover:text-foreground';
      return (
        <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
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
