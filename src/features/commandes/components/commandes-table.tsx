'use client';

import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { ShoppingBag, Plus } from 'lucide-react';
import { commandesColumns } from './commandes-columns';
import type { Commande } from '@/features/commandes/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const COL_WIDTHS: Record<string, string> = {
  number: '12%',
  client: '18%',
  event: '14%',
  menuName: '12%',
  totalAmount: '10%',
  status: '10%',
  createdAt: '12%',
  actions: '100px',
};

const CENTERED = new Set(['actions', 'totalAmount', 'status']);

interface CommandesTableProps {
  data: Commande[];
  loading: boolean;
  onView: (cmd: Commande) => void;
  onEdit: (cmd: Commande) => void;
  onDelete: (cmd: Commande) => void;
}

export function CommandesTable({ data, loading, onView, onEdit, onDelete }: CommandesTableProps) {
  const columns = useMemo(
    () => commandesColumns(onView, onEdit, onDelete),
    [onView, onEdit, onDelete],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="divide-y divide-border/10">
        {Array.from({ length: 5 }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="flex items-center gap-4 px-5 py-2.5"
          >
            <Skeleton className="h-3.5 w-[12%]" />
            <Skeleton className="h-3.5 w-[18%]" />
            <Skeleton className="h-3.5 w-[14%]" />
            <Skeleton className="h-3.5 w-[12%]" />
            <Skeleton className="h-3.5 w-[10%]" />
            <Skeleton className="h-4 w-[10%]" />
            <Skeleton className="h-3.5 w-[12%]" />
            <Skeleton className="h-6 w-[100px]" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center gap-5">
        <div className="size-16 rounded-2xl border bg-background flex items-center justify-center">
          <ShoppingBag className="size-7 text-muted-foreground/40" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Aucune commande trouvée</p>
          <p className="text-sm text-muted-foreground mt-1">Créez votre première commande pour commencer.</p>
        </div>
        <a
          href="/dashboard/commandes/new"
          className="inline-flex items-center gap-2 bg-foreground hover:opacity-90 text-background rounded-xl px-5 py-2.5 text-sm font-medium transition-all shadow-sm"
        >
          <Plus className="size-4" strokeWidth={1.8} />
          Nouvelle commande
        </a>
      </div>
    );
  }

  const rowModel = table.getRowModel();

  return (
    <Table className="w-full table-fixed">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="border-b border-border/20 bg-muted/20">
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                style={{ width: COL_WIDTHS[header.id] || 'auto' }}
                className={`text-xs uppercase tracking-[0.15em] text-muted-foreground/80 font-medium px-2 py-2 whitespace-nowrap overflow-hidden ${CENTERED.has(header.id) ? 'text-center' : ''}`}
              >
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rowModel.rows.map((row, index) => (
          <motion.tr
            key={row.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.015, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="group border-b border-border/[0.04] hover:bg-muted/40 transition-all cursor-pointer"
            onClick={() => onView(row.original)}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                style={{ width: COL_WIDTHS[cell.column.id] || 'auto' }}
                className={`px-2 py-2.5 text-sm overflow-hidden ${CENTERED.has(cell.column.id) ? 'text-center' : ''}`}
                onClick={(e) => {
                  if (cell.column.id === 'actions') e.stopPropagation();
                }}
              >
                {cell.getIsPlaceholder() ? null : flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </motion.tr>
        ))}
      </TableBody>
    </Table>
  );
}
