'use client';

import { useState, useRef, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Eye, Pencil, FileText, MessageCircle, MoreHorizontal, Trash2,
  HeartHandshake, Building2, Cake, Wine, Sparkles, Users,
} from 'lucide-react';
import { Event, STATUS_COLORS } from '@/features/events/types';
import { Badge } from '@/components/ui/badge';
import { SensitiveValue } from '@/components/privacy-mode';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

const TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Mariage', CORPORATE: 'Entreprise', BIRTHDAY: 'Anniversaire',
  ANNIVERSARY: 'Cocktail', HOLIDAY: 'Gala', OTHER: 'Privé',
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  WEDDING: HeartHandshake, CORPORATE: Building2, BIRTHDAY: Cake,
  ANNIVERSARY: Wine, HOLIDAY: Sparkles, OTHER: Users,
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', PLANNED: 'Planifié', CONFIRMED: 'Confirmé',
  IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', CANCELLED: 'Annulé',
};

const STATUS_DOT: Record<string, string> = {
  DRAFT: 'bg-gray-400', PLANNED: 'bg-blue-500', CONFIRMED: 'bg-green-500',
  IN_PROGRESS: 'bg-orange-500', COMPLETED: 'bg-green-700', CANCELLED: 'bg-red-500',
};

function CountdownCell({ days }: { days: number | undefined }) {
  if (days === undefined) return <span className="text-muted-foreground/30 text-sm font-medium">—</span>;
  if (days < 0) return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground/50">
      <span className="size-1.5 rounded-full bg-gray-400" />
      Passé
    </span>
  );
  if (days === 0) return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-orange-600">
      <span className="size-1.5 rounded-full bg-orange-500" />
      Aujourd&apos;hui
    </span>
  );
  if (days <= 3) return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-red-600">
      <span className="size-1.5 rounded-full bg-red-500" />
      {days} jour{days > 1 ? 's' : ''}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      {days} jours
    </span>
  );
}

function ActionsCell({ event, onEdit, onDelete }: { event: Event; onEdit: (e: Event) => void; onDelete: (e: Event) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const whatsappUrl = event.clientPhone
    ? `https://wa.me/${event.clientPhone.replace(/[^0-9]/g, '')}`
    : null;

  const b = 'size-8 rounded-md hover:bg-muted/50 transition-all flex items-center justify-center text-muted-foreground/40 hover:text-foreground';

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button className={b} title="Voir les détails" onClick={() => window.location.href = `/dashboard/events/${event.id}`}>
        <Eye className="h-4 w-4" strokeWidth={1.8} />
      </button>
      <button className={b} title="Modifier l'événement" onClick={() => onEdit(event)}>
        <Pencil className="h-4 w-4" strokeWidth={1.8} />
      </button>
      <button className={b} title="Exporter en PDF" onClick={() => window.open(`/api/events/${event.id}/pdf`, '_blank')}>
        <FileText className="h-4 w-4" strokeWidth={1.8} />
      </button>
      <button
        className={`${b} ${!whatsappUrl ? 'opacity-20 cursor-not-allowed hover:bg-transparent' : ''}`}
        title={whatsappUrl ? 'Envoyer sur WhatsApp' : 'Aucun numéro'}
        disabled={!whatsappUrl}
        onClick={() => whatsappUrl && window.open(whatsappUrl, '_blank')}
      >
        <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
      </button>
      <div className="relative" ref={menuRef}>
        <button className={b} title="Plus d'actions" onClick={() => setMenuOpen(!menuOpen)}>
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.8} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] w-auto rounded-lg border border-border/60 bg-card shadow-lift py-1">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              onClick={() => { setMenuOpen(false); onDelete(event); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Supprimer</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const eventsColumns = (
  onEdit: (event: Event) => void,
  onDelete: (event: Event) => void,
  isPrivacyMode?: boolean
): ColumnDef<Event>[] => [
  {
    accessorKey: 'name',
    header: 'Événement',
    size: 270,
    cell: ({ row }) => {
      const e = row.original;
      const Icon = TYPE_ICONS[e.type] || Users;
      return (
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg border border-border/50 bg-foreground/[0.03] flex items-center justify-center shrink-0">
            <Icon className="size-4 text-muted-foreground/60" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <a href={`/dashboard/events/${e.id}`} className="font-semibold text-sm text-foreground hover:text-foreground/80 transition-colors truncate block leading-tight">
              {e.name}
            </a>
            <span className="text-xs text-muted-foreground/40">{TYPE_LABELS[e.type] || e.type}</span>
          </div>
        </div>
      );
    },
  },
  {
    id: 'client',
    header: 'Client',
    size: 110,
    cell: ({ row }) => {
      const e = row.original;
      return (
        <div className="min-w-0">
          {e.clientName ? (
            <span className="text-sm text-foreground truncate block leading-tight">{e.clientName}</span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-muted/60 text-[11px] text-muted-foreground/50 font-medium">Non assigné</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'startDate',
    header: 'Date',
    size: 110,
    cell: ({ row }) => {
      const e = row.original;
      const date = e.startDate
        ? new Date(e.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
        : '—';
      return (
        <span className="text-sm tabular-nums text-foreground/70 whitespace-nowrap">{date}</span>
      );
    },
  },
  {
    accessorKey: 'guestCount',
    header: 'Invités',
    size: 70,
    cell: ({ row }) => {
      const val = row.original.guestCount;
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-foreground/60">
          {val != null ? (
            <>
              <Users className="size-3.5 text-muted-foreground/30" strokeWidth={1.8} />
              <span className="tabular-nums">{val}</span>
            </>
          ) : (
            <span className="text-muted-foreground/30">—</span>
          )}
        </span>
      );
    },
  },
  {
    id: 'budget',
    header: () => <div className="text-right">Budget</div>,
    size: 120,
    cell: ({ row }) => {
      const budget = Number(row.original.budget ?? 0);
      return (
        <div className="flex justify-end">
          <SensitiveValue hidden={isPrivacyMode} className="text-sm font-semibold tabular-nums text-foreground whitespace-nowrap">
            {budget > 0 ? mad(budget) : <span className="text-muted-foreground/30">—</span>}
          </SensitiveValue>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    size: 100,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge className={`${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'} inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border-0`}>
          <span className={`size-1.5 rounded-full ${STATUS_DOT[status] || 'bg-gray-400'}`} />
          {STATUS_LABELS[status] || status}
        </Badge>
      );
    },
  },
  {
    id: 'countdown',
    header: 'J-',
    size: 85,
    cell: ({ row }) => <CountdownCell days={row.original.daysUntil} />,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <ActionsCell event={row.original} onEdit={onEdit} onDelete={onDelete} />,
  },
];
