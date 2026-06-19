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
  commande: '15%',
  client: '22%',
  event: '20%',
  date: '8%',
  guestCount: '5%',
  totalAmount: '10%',
  status: '8%',
  actions: '140px',
};

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
      <div className="rounded-xl border border-border/20 bg-card shadow-sm divide-y divide-border/5 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="flex items-center gap-4 px-5 py-[18px]"
          >
            <Skeleton className="h-4 w-[15%]" />
            <Skeleton className="h-4 w-[22%]" />
            <Skeleton className="h-4 w-[20%]" />
            <Skeleton className="h-4 w-[9%]" />
            <Skeleton className="h-4 w-[6%]" />
            <Skeleton className="h-4 w-[11%]" />
            <Skeleton className="h-4 w-[8%]" />
            <Skeleton className="h-4 w-[9%]" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border/20 bg-card shadow-sm py-24 flex flex-col items-center gap-6">
        <div className="size-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/50 flex items-center justify-center shadow-sm">
          <ShoppingBag className="size-6 text-amber-500/60" strokeWidth={1.5} />
        </div>
        <div className="text-center max-w-[260px]">
          <p className="text-base font-semibold text-foreground">Aucune commande</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Créez votre première commande pour commencer à gérer vos événements traiteur.
          </p>
        </div>
        <a
          href="/dashboard/commandes/new"
          className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background rounded-xl px-5 py-2.5 text-sm font-medium transition-all shadow-sm"
        >
          <Plus className="size-4" strokeWidth={1.8} />
          Nouvelle commande
        </a>
      </div>
    );
  }

  const rowModel = table.getRowModel();

  return (
    <div className="rounded-xl border border-border/20 bg-card shadow-sm">
      <Table className="w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b border-border/10">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: COL_WIDTHS[header.id] || 'auto' }}
                  className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold px-4 py-3 whitespace-nowrap select-none"
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
              transition={{ delay: index * 0.02, duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
              className="group border-b border-border/[0.03] last:border-b-0 transition-all hover:bg-muted/20"
              style={{ height: 68 }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  style={{ width: COL_WIDTHS[cell.column.id] || 'auto' }}
                  className="px-4 py-0 text-sm relative"
                >
                  <div className="flex items-center h-[68px]">
                    {cell.getIsPlaceholder() ? null : flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </TableCell>
              ))}
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
