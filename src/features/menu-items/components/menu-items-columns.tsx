import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { MenuItem, MenuItemCategory } from '@/features/menu-items/types';
import { Eye, Pencil, Copy, Archive, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const CATEGORY_LABELS: Record<MenuItemCategory, string> = {
  FOOD: 'Food',
  DRINKS: 'Drinks',
  DESSERTS: 'Desserts',
  DECORATION: 'Decoration',
  STAFF: 'Services',
  ENTERTAINMENT: 'Entertainment',
  EXTRAS: 'Extras',
};

const CATEGORY_ACCENTS: Record<string, string> = {
  FOOD: 'from-amber-100 via-orange-50 to-rose-50',
  DRINKS: 'from-emerald-100 via-teal-50 to-lime-50',
  DESSERTS: 'from-pink-100 via-rose-50 to-amber-50',
  DECORATION: 'from-fuchsia-100 via-rose-50 to-amber-50',
  STAFF: 'from-stone-100 via-zinc-50 to-neutral-100',
  ENTERTAINMENT: 'from-violet-100 via-purple-50 to-fuchsia-50',
  EXTRAS: 'from-gray-100 via-zinc-50 to-stone-100',
};

const EMOJI_MAP: Record<string, string> = {
  FOOD: '🍲',
  DRINKS: '🍹',
  DESSERTS: '🍬',
  DECORATION: '💐',
  STAFF: '🎩',
  ENTERTAINMENT: '🎧',
  EXTRAS: '🎆',
};

const activeColors: Record<'true' | 'false', string> = {
  true: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  false: 'text-gray-500 bg-gray-100 border-gray-200',
};

export const menuItemsColumns = (
  onEdit: (item: MenuItem) => void,
  onDelete: (item: MenuItem) => void,
  onDuplicate: (item: MenuItem) => void,
  onArchive: (item: MenuItem) => void,
): ColumnDef<MenuItem>[] => [
  {
    id: 'item',
    header: 'Item',
    size: 300,
    cell: ({ row }) => {
      const item = row.original;
      const accent = CATEGORY_ACCENTS[item.category] || 'from-gray-100 to-gray-50';
      const emoji = EMOJI_MAP[item.category] || '📦';
      return (
        <div className="flex items-center gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-lg ${accent}`}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="h-full w-full rounded-xl object-cover" />
            ) : (
              emoji
            )}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-foreground truncate">{item.name}</div>
            {item.notes && <div className="line-clamp-1 text-xs text-muted-foreground">{item.notes}</div>}
          </div>
        </div>
      );
    },
  },
  {
    id: 'category',
    header: 'Catégorie',
    size: 120,
    cell: ({ row }) => {
      const cat = row.original.category;
      return <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[cat] || cat}</span>;
    },
  },
  {
    accessorKey: 'unitPrice',
    header: 'Prix',
    size: 110,
    cell: ({ row }) => {
      const price = Number(row.getValue('unitPrice'));
      return <span className="font-display text-base text-charcoal tabular-nums">{formatCurrency(price)}</span>;
    },
  },
  {
    id: 'unit',
    accessorKey: 'unit',
    header: 'Unité',
    size: 90,
    cell: ({ row }) => <span className="text-xs text-muted-foreground">/ {row.getValue('unit') || '—'}</span>,
  },
  {
    accessorKey: 'isActive',
    header: 'Statut',
    size: 100,
    cell: ({ row }) => {
      const active = row.getValue('isActive') as boolean;
      return (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
          active ? 'text-emerald-700 bg-emerald-50 ring-emerald-500/30' : 'text-zinc-700 bg-zinc-50 ring-zinc-500/30'
        }`}>
          {active ? 'Active' : 'Inactive'}
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Créé',
    size: 110,
    cell: ({ row }) => {
      const d = new Date(row.getValue('createdAt'));
      return <span className="text-xs text-muted-foreground tabular-nums">{d.toLocaleDateString('fr-FR')}</span>;
    },
  },
  {
    id: 'actions',
    header: '',
    size: 140,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center justify-end gap-0.5">
          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground" title="Voir" onClick={() => { window.location.href = `/dashboard/menu-items/${item.id}`; }}>
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground" title="Modifier" onClick={() => onEdit(item)}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground" title="Dupliquer" onClick={() => onDuplicate(item)}>
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground" title="Archiver" onClick={() => onArchive(item)}>
            <Archive className="h-3.5 w-3.5" />
          </button>
          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-red-50 hover:text-red-600" title="Supprimer" onClick={() => onDelete(item)}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    },
  },
];
