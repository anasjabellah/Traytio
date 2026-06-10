'use client';

import { ColumnDef } from '@tanstack/react-table';
import {
  Eye, Pencil, Trash2, Mail, Phone, MapPin,
} from 'lucide-react';
import { ClientWithStats } from '@/features/clients/types';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('');
  return (
    <div className="size-9 rounded-lg bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold-deep)]/20 flex items-center justify-center font-medium text-[var(--gold-foreground)] shrink-0 text-xs">
      {initials}
    </div>
  );
}

function CreatedCell({ date }: { date: Date }) {
  return (
    <span className="text-sm text-muted-foreground/70 whitespace-nowrap">
      {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
    </span>
  );
}

function ActivityCell({ lastOrderAt, createdAt }: { lastOrderAt: Date | null | undefined; createdAt: Date }) {
  const date = lastOrderAt ?? createdAt;
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return <span className="text-sm font-medium text-emerald-600">Aujourd&apos;hui</span>;
  if (days === 1) return <span className="text-sm text-muted-foreground/70">Hier</span>;
  if (days < 7) return <span className="text-sm text-muted-foreground/70">Il y a {days} jours</span>;
  return <span className="text-sm text-muted-foreground/50">{new Date(date).toLocaleDateString('fr-FR')}</span>;
}

export const clientsColumns = (
  onView: (client: ClientWithStats) => void,
  onEdit: (client: ClientWithStats) => void,
  onDelete: (client: ClientWithStats) => void,
): ColumnDef<ClientWithStats>[] => [
  {
    accessorKey: 'name',
    header: 'Client',
    size: 300,
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="flex items-center gap-2.5">
          <Avatar name={c.name} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-foreground leading-tight truncate">{c.name}</div>
            {c.company && (
              <div className="text-xs text-muted-foreground/50 mt-0.5 truncate">{c.company}</div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: 'contact',
    header: 'Contact',
    size: 220,
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs truncate">
            <Mail className="size-3 shrink-0 text-muted-foreground/30" strokeWidth={1.5} />
            <span className={c.email ? 'text-muted-foreground/70 truncate' : 'text-muted-foreground/30 truncate'}>
              {c.email ?? '—'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs truncate">
            <Phone className="size-3 shrink-0 text-muted-foreground/30" strokeWidth={1.5} />
            <span className={c.phone ? 'text-muted-foreground/70 truncate' : 'text-muted-foreground/30 truncate'}>
              {c.phone ?? '—'}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'city',
    header: 'Ville',
    size: 120,
    cell: ({ row }) => {
      const city = row.getValue('city') as string | null;
      return city ? (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground/70 truncate">
          <MapPin className="size-3.5 shrink-0 text-muted-foreground/30" strokeWidth={1.5} />
          <span className="truncate">{city}</span>
        </div>
      ) : (
        <span className="text-muted-foreground/30 text-sm">—</span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Créé le',
    size: 110,
    cell: ({ row }) => <CreatedCell date={row.getValue('createdAt') as Date} />,
  },
  {
    accessorKey: 'totalSpent',
    header: 'Revenu',
    size: 120,
    cell: ({ row }) => {
      const val = Number(row.getValue('totalSpent'));
      return (
        <span className={`text-sm font-semibold tabular-nums ${val > 0 ? 'text-foreground' : 'text-muted-foreground/30'}`}>
          {val > 0 ? mad(val) : '—'}
        </span>
      );
    },
  },
  {
    id: 'activity',
    header: 'Activité',
    size: 120,
    cell: ({ row }) => <ActivityCell lastOrderAt={row.original.lastOrderAt} createdAt={row.original.createdAt} />,
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 90,
    cell: ({ row }) => {
      const c = row.original;
      const b = 'size-7 rounded-md hover:bg-muted/50 transition-all flex items-center justify-center text-muted-foreground/40 hover:text-foreground';
      return (
        <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button className={b} title="Voir" onClick={() => onView(c)}>
            <Eye className="size-3.5" strokeWidth={1.8} />
          </button>
          <button className={b} title="Modifier" onClick={() => onEdit(c)}>
            <Pencil className="size-3.5" strokeWidth={1.8} />
          </button>
          <button className={`${b} hover:text-red-600`} title="Supprimer" onClick={() => onDelete(c)}>
            <Trash2 className="size-3.5" strokeWidth={1.8} />
          </button>
        </div>
      );
    },
  },
];
