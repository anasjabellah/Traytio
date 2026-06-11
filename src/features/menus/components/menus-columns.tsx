import { ColumnDef } from '@tanstack/react-table';
import { Menu } from '@/features/menus/types';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { CATEGORY_LABELS, CATEGORY_BADGE_COLORS } from '@/features/menus/constants';

export const menusColumns = (
  onEdit: (menu: Menu) => void,
  onDelete: (menu: Menu) => void
): ColumnDef<Menu>[] => [
  {
    accessorKey: 'name',
    header: 'Nom du menu',
    size: 200,
    cell: ({ row }) => (
      <a
        href={`/dashboard/menus/${row.original.id}`}
        className="font-medium hover:underline cursor-pointer"
      >
        {row.original.name}
      </a>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Catégorie',
    size: 150,
    cell: ({ row }) => {
      const cat = row.getValue('category') as keyof typeof CATEGORY_LABELS;
      const colorClass = CATEGORY_BADGE_COLORS[cat] ?? 'bg-gray-100 text-gray-700 border-gray-200';
      const label = CATEGORY_LABELS[cat] ?? cat;
      return (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${colorClass}`}>
          {label}
        </span>
      );
    },
  },
  {
    accessorKey: 'pricePerPerson',
    header: 'Prix par personne',
    size: 150,
    cell: ({ row }) => {
      const price = Number(row.getValue('pricePerPerson'));
      return <span className="font-display tabular-nums">{formatCurrency(price)}</span>;
    },
  },
  {
    accessorKey: 'minPersons',
    header: 'Min. pax',
    size: 80,
    cell: ({ row }) => <span className="tabular-nums">{row.getValue('minPersons')}</span>,
  },
  {
    accessorKey: 'maxPersons',
    header: 'Max. pax',
    size: 80,
    cell: ({ row }) => {
      const v = row.getValue('maxPersons');
      return <span className="tabular-nums">{v != null ? String(v) : '—'}</span>;
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Statut',
    size: 100,
    cell: ({ row }) => {
      const active = row.getValue('isActive') as boolean;
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
          active
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50'
            : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200/50'
        }`}>
          <span className={`size-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {active ? 'Actif' : 'Inactif'}
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Créé le',
    size: 120,
    cell: ({ row }) => {
      const d = new Date(row.getValue('createdAt'));
      return <span className="text-muted-foreground">{d.toLocaleDateString('fr-FR')}</span>;
    },
  },
  {
    id: 'items',
    header: 'Articles',
    size: 80,
    cell: ({ row }) => {
      const count = row.original.menuItems?.length ?? 0;
      return <span className="tabular-nums text-muted-foreground">{count}</span>;
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 120,
    cell: ({ row }) => {
      const menu = row.original;
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { window.location.href = `/dashboard/menus/${menu.id}`; }}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white text-gray-900 shadow-soft backdrop-blur transition hover:bg-black hover:text-white"
            title="Voir"
          >
            <Eye className="size-3.5" />
          </button>
          <button
            onClick={() => onEdit(menu)}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white text-gray-900 shadow-soft backdrop-blur transition hover:bg-black hover:text-white"
            title="Modifier"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => onDelete(menu)}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white text-gray-900 shadow-soft backdrop-blur transition hover:bg-red-600 hover:text-white"
            title="Supprimer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      );
    },
  },
];
