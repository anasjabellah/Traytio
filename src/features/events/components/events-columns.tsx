import { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { Event } from '@/features/events/types';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

// Badge color mapping based on status
const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-200 text-gray-800',
  PLANNED: 'bg-blue-200 text-blue-800',
  CONFIRMED: 'bg-green-200 text-green-800',
  IN_PROGRESS: 'bg-orange-200 text-orange-800',
  COMPLETED: 'bg-green-800 text-white', // dark green
  CANCELLED: 'bg-red-200 text-red-800',
};

export const eventsColumns = (
  onEdit: (event: Event) => void,
  onDelete: (event: Event) => void
): ColumnDef<Event>[] => [
  {
    accessorKey: 'name',
    header: 'Nom de l\'événement',
    size: 200,
    cell: ({ row }) => (
    <a
      href={`/dashboard/events/${row.original.id}`}
      className="font-medium hover:underline cursor-pointer"
    >
      {row.original.name}
    </a>
  ),
  },

  {
    accessorKey: 'type',
    header: 'Type',
    size: 150,
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    size: 150,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const className = statusColors[status] || 'bg-gray-200 text-gray-800';
      return <Badge className={className}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'startDate',
    header: 'Date de début',
    size: 150,
    cell: ({ row }) => {
      const date = row.getValue('startDate') as string;
      return new Date(date).toLocaleDateString('fr-FR');
    },
  },
  {
    accessorKey: 'endDate',
    header: 'Date de fin',
    size: 150,
    cell: ({ row }) => {
      const date = row.getValue('endDate') as string | null;
      return date ? new Date(date).toLocaleDateString('fr-FR') : '—';
    },
  },
  {
    accessorKey: 'budget',
    header: 'Budget',
    size: 150,
    cell: ({ row }) => {
      const budget = Number(row.getValue('budget'));
      return budget ? formatCurrency(budget) : '—';
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 150,
    cell: ({ row }) => {
      const event = row.original;
      return (
        <div className="flex space-x-2">
          <button
            className="btn-ghost btn-sm hover:btn-primary"
            title="Voir"
            onClick={() => window.location.href = `/dashboard/events/${event.id}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            className="btn-ghost btn-sm hover:btn-primary"
            title="Modifier" onClick={() => onEdit(event)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 012.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            className="btn-ghost btn-sm hover:btn-destructive"
            title="Supprimer" onClick={() => onDelete(event)}
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
