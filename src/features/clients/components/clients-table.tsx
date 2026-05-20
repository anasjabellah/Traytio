import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, Row } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { clientsColumns } from './clients-columns';
import { ClientWithStats } from '@/features/clients/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface ClientsTableProps {
  data: ClientWithStats[];
  loading: boolean;
  onView: (client: ClientWithStats) => void;
  onEdit: (client: ClientWithStats) => void;
  onDelete: (client: ClientWithStats) => void;
}

export function ClientsTable({ data, loading, onView, onEdit, onDelete }: ClientsTableProps) {
  // Override the actions column to use the provided callbacks
  const columns = useMemo(() => {
    return clientsColumns.map(column =>
      column.id === 'actions'
        ? {
            ...column,
            cell: ({ row }: { row: Row<ClientWithStats> }) => {
              const client = row.original;
              return (
                <div className="flex space-x-2">
                  <button
                    onClick={() => onView(client)}
                    className="btn-ghost btn-sm hover:btn-primary"
                    title="Voir les détails"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onEdit(client)}
                    className="btn-ghost btn-sm hover:btn-primary"
                    title="Modifier"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 012.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(client)}
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
          }
        : column
    );
  }, [onView, onEdit, onDelete]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <Table className="mt-4">
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <motion.tr
              key={`skeleton-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              {columns.map((column) => (
                <TableCell key={column.id} className="px-4 py-2">
                  <Skeleton className="h-4 w-full" />
                  {!(column as any).accessorKey && column.id === 'actions' && (
                    <Skeleton className="h-4 w-full" />
                  )}
                </TableCell>
              ))}
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    );
  }

  const rowModel = table.getRowModel();

  if (rowModel.rows.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-muted-foreground">Aucun client trouvé</p>
      </div>
    );
  }

  return (
    <Table className="mt-4">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableHead key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableCell
                key={header.id}
                colSpan={header.colSpan}
                className="text-left font-medium text-muted-foreground"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableCell>
            ))}
          </TableHead>
        ))}
      </TableHeader>
      <TableBody>
        {rowModel.rows.map((row, index) => {
          const client = row.original;
          return (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.4 }}
              className="cursor-pointer hover:bg-card/20"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                                    className="px-4 py-2 text-sm"
                >
                  {cell.getIsPlaceholder()
                    ? null
                    : flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </motion.tr>
          );
        })}
      </TableBody>
    </Table>
  );
}