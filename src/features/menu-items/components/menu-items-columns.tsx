// src/features/menu-items/components/menu-items-columns.tsx

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { MenuItem, MenuItemCategory } from '@/features/menu-items/types';
import { Eye, Pencil, Trash2 } from 'lucide-react';

// Badge color mapping for category (MAD currency)
const categoryColors: Record<MenuItemCategory, string> = {
  FOOD: 'bg-amber-200 text-amber-800',
  DRINKS: 'bg-blue-200 text-blue-800',
  DESSERTS: 'bg-pink-200 text-pink-800',
  DECORATION: 'bg-purple-200 text-purple-800',
  STAFF: 'bg-green-200 text-green-800',
  ENTERTAINMENT: 'bg-orange-200 text-orange-800',
  EXTRAS: 'bg-gray-200 text-gray-800',
};

// French label mapping for category display
const categoryLabels: Record<MenuItemCategory, string> = {
  FOOD: 'Aliment',
  DRINKS: 'Boisson',
  DESSERTS: 'Dessert',
  DECORATION: 'Décoration',
  STAFF: 'Personnel',
  ENTERTAINMENT: 'Divertissement',
  EXTRAS: 'Extras',
};

const activeColors: Record<'true' | 'false', string> = {
  true: 'bg-green-200 text-green-800',
  false: 'bg-gray-200 text-gray-800',
};

export const menuItemsColumns = (
  onEdit: (item: MenuItem) => void,
  onDelete: (item: MenuItem) => void
): ColumnDef<MenuItem>[] => [
  {
    accessorKey: 'imageUrl',
    header: 'Image',
    size: 80,
    cell: ({ row }) => {
      const url = row.getValue('imageUrl') as string;
      return url ? <img src={url} alt="image" width={40} height={40} className="object-cover rounded" /> : null;
    },
  },
  {
    accessorKey: 'name',
    header: "Nom de l'article",
    size: 200,
    cell: ({ row }) => (
      <a
        href={`/dashboard/menu-items/${row.original.id}`}
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
      const cat = row.getValue('category') as MenuItemCategory;
      const className = categoryColors[cat] ?? 'bg-gray-200 text-gray-800';
      const label = categoryLabels[cat] ?? cat;
      return <Badge className={className}>{label}</Badge>;
    },
  },
  {
    accessorKey: 'unitPrice',
    header: 'Prix unitaire (MAD)',
    size: 150,
    cell: ({ row }) => {
      const price = Number(row.getValue('unitPrice'));
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(price);
    },
  },
  {
    accessorKey: 'unit',
    header: 'Unité',
    size: 100,
    cell: ({ row }) => row.getValue('unit') ?? '-',
  },
  {
    accessorKey: 'isActive',
    header: 'Actif',
    size: 100,
    cell: ({ row }) => {
      const active = row.getValue('isActive') as boolean;
      const className = activeColors[active ? 'true' : 'false'];
      return <Badge className={className}>{active ? 'Actif' : 'Inactif'}</Badge>;
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
      const item = row.original;
      return (
        <div className="flex space-x-2">
          {/* View button */}
          <button
            className="btn-ghost btn-sm hover:btn-primary"
            title="Voir les détails"
            onClick={() => {
              // Navigate to detail page
              window.location.href = `/dashboard/menu-items/${item.id}`;
            }}
          >
            <Eye className="h-4 w-4" />
          </button>
          {/* Edit button */}
          <button
            className="btn-ghost btn-sm hover:btn-primary cursor-pointer hover:text-[#C9A96E]"
            title="Modifier"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-4 w-4" />
          </button>
          {/* Delete button */}
          <button
            className="btn-ghost btn-sm hover:btn-destructive cursor-pointer hover:text-red-600"
            title="Supprimer"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      );
    },
  },
];
