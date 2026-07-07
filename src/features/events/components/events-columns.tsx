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

  const b = 'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:size-8 rounded-md hover:bg-muted/50 transition-all flex items-center justify-center text-muted-foreground/40 hover:text-foreground';

  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
    header: 'Tables',
    size: 70,
    cell: ({ row }) => {
      const val = row.original.guestCount;
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-foreground/60">
          {val != null ? (
            <>
              <TableIcon className="size-3.5 text-muted-foreground/30" />
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

function TableIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 491.413 491.413" fill="currentColor" className={className}>
      <path d="M491.413,133.867c0-62.4-126.613-96.107-245.653-96.107S0,71.467,0,133.867c0,60.48,118.72,93.973,234.453,96v125.76c-0.213,0.747-0.533,1.387-0.853,2.133c-4.587,0.32-8.533,3.52-9.6,8.107c-1.173,4.16-2.773,8.107-4.8,11.947c-1.067,0.533-2.24,0.853-3.413,1.067c-12.373,1.6-30.08-17.707-36.693-27.307c-3.307-4.907-10.027-6.08-14.827-2.773s-6.08,10.027-2.773,14.827c2.347,3.413,20.373,29.013,42.987,35.2c-13.013,14.08-34.027,28.373-67.84,33.6c-5.867,0.853-9.813,6.293-8.96,12.16c0.747,5.227,5.333,9.067,10.56,9.067c0.533,0,1.067,0,1.6-0.107c56.853-8.64,83.733-39.68,95.787-61.227c3.627-3.093,6.827-6.613,9.387-10.667c2.56,3.947,5.76,7.573,9.387,10.667c12.16,21.547,39.04,52.587,95.893,61.227c0.533,0.107,1.067,0.107,1.6,0.107c5.867,0,10.667-4.8,10.667-10.667c0-5.333-3.84-9.813-9.067-10.56c-33.92-5.227-55.04-19.52-67.947-33.6c22.613-6.293,40.747-31.893,43.093-35.307c3.307-4.8,2.133-11.52-2.667-14.827s-11.52-2.133-14.827,2.773c-6.72,9.6-24.213,28.907-36.693,27.307c-1.173-0.213-2.347-0.533-3.413-1.067c-2.027-3.84-3.627-7.787-4.8-11.947c-1.173-4.587-5.12-7.787-9.707-8.107c-5.44-0.32-9.067-0.533-10.56-2.133v-125.76C372.693,227.84,491.413,194.347,491.413,133.867z M245.76,211.733c-113.173,0-192.853-31.04-204.8-77.867c11.947-46.827,91.627-77.867,204.8-77.867s192.853,31.04,204.8,77.867C438.613,180.693,358.933,211.733,245.76,211.733z" />
    </svg>
  );
}

