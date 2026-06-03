import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Menu, MenuCategory } from '@/features/menus/types';
import { Eye, Pencil, Trash2 } from 'lucide-react';

const categoryColors: Record<MenuCategory, string> = {
  WEDDING: 'bg-pink-200 text-pink-800',
  CORPORATE: 'bg-blue-200 text-blue-800',
  BUFFET: 'bg-amber-200 text-amber-800',
  COCKTAIL: 'bg-purple-200 text-purple-800',
  BRUNCH: 'bg-orange-200 text-orange-800',
  DESSERT: 'bg-rose-200 text-rose-800',
  CUSTOM: 'bg-gray-200 text-gray-800',
};

const categoryLabels: Record<MenuCategory, string> = {
  WEDDING: 'Mariage',
  CORPORATE: 'Entreprise',
  BUFFET: 'Buffet',
  COCKTAIL: 'Cocktail',
  BRUNCH: 'Brunch',
  DESSERT: 'Dessert',
  CUSTOM: 'Custom',
};

const activeColors: Record<'true' | 'false', string> = {
  true: 'bg-green-200 text-green-800',
  false: 'bg-gray-200 text-gray-800',
};

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
      const cat = row.getValue('category') as MenuCategory;
      const className = categoryColors[cat] ?? 'bg-gray-200 text-gray-800';
      const label = categoryLabels[cat] ?? cat;
      return <Badge className={className}>{label}</Badge>;
    },
  },
  {
    accessorKey: 'pricePerPerson',
    header: 'Prix par personne (€)',
    size: 150,
    cell: ({ row }) => {
      const price = Number(row.getValue('pricePerPerson'));
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
    },
  },
  {
    accessorKey: 'minPersons',
    header: 'Nb. min',
    size: 100,
  },
  {
    accessorKey: 'maxPersons',
    header: 'Nb. max',
    size: 100,
  },
  {
    accessorKey: 'isActive',
    header: 'Actif',
    size: 100,
    cell: ({ row }) => {
      const active = row.getValue('isActive') as boolean;
      const className = activeColors[active ? 'true' : 'false'];
      return <Badge className={className}>{active ? 'Oui' : 'Non'}</Badge>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Créé le',
    size: 150,
    cell: ({ row }) => {
      const d = new Date(row.getValue('createdAt'));
      return d.toLocaleDateString('fr-FR');
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 150,
    cell: ({ row }) => {
      const menu = row.original;
      return (
        <div className="flex space-x-2">
          <button
            className="btn-ghost btn-sm hover:btn-primary cursor-pointer hover:text-[#C9A96E]"
            title="Voir les détails"
            onClick={() => {
              window.location.href = `/dashboard/menus/${menu.id}`;
            }}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            className="btn-ghost btn-sm hover:btn-primary cursor-pointer hover:text-[#C9A96E]"
            title="Modifier"
            onClick={() => onEdit(menu)}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="btn-ghost btn-sm hover:btn-destructive cursor-pointer hover:text-red-600"
            title="Supprimer"
            onClick={() => onDelete(menu)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      );
    },
  },
];
