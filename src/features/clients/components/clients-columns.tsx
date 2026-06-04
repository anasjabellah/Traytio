import { ColumnDef } from '@tanstack/react-table';
import { ClientWithStats } from '@/features/clients/types';
import { formatCurrency } from '@/lib/utils';

export const clientsColumns: ColumnDef<ClientWithStats>[] = [
  {
    accessorKey: 'name',
    header: 'Nom du client',
    size: 200,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    size: 200,
  },
  {
    accessorKey: 'phone',
    header: 'Téléphone',
    size: 150,
  },
  {
    accessorKey: 'city',
    header: 'Ville',
    size: 150,
  },
  {
    accessorKey: 'totalSpent',
    header: 'Total dépensé',
    size: 150,
    cell: ({ row }) => {
      const totalSpent = Number(row.getValue('totalSpent'));
      return formatCurrency(totalSpent);
    },
  },
  {
    accessorKey: 'lastOrderAt',
    header: 'Dernière commande',
    size: 180,
    cell: ({ row }) => {
      const lastOrderAt = row.getValue('lastOrderAt');
      return lastOrderAt ? new Date(lastOrderAt as string).toLocaleDateString('fr-FR') : '—';
    },
  },
  {
    accessorKey: 'commandesCount',
    header: 'Commandes',
    size: 100,
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 120,
    cell: ({ row }) => {
      const client = row.original;
      return (
        <div className="flex space-x-2">
          <button
            className="btn-ghost btn-sm hover:btn-primary"
            title="Voir les détails"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            className="btn-ghost btn-sm hover:btn-primary"
            title="Modifier"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 012.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            className="btn-ghost btn-sm hover:btn-destructive"
            title="Supprimer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      );
    },
  },
];