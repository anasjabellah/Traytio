'use client';

import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { eventsColumns } from './events-columns';
import { Event } from '@/features/events/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calendar } from 'lucide-react';

interface EventsTableProps {
  data: Event[];
  loading: boolean;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  isPrivacyMode?: boolean;
}

export function EventsTable({ data, loading, onEdit, onDelete, isPrivacyMode }: EventsTableProps) {
  const columns = useMemo(() => eventsColumns(onEdit, onDelete, isPrivacyMode), [onEdit, onDelete, isPrivacyMode]);

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
            <Skeleton className="size-9 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3.5 w-20 hidden md:block" />
            <Skeleton className="h-3.5 w-12 hidden md:block" />
            <Skeleton className="h-3.5 w-10 hidden md:block" />
            <Skeleton className="h-3.5 w-20 hidden md:block" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-6 w-28" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center gap-5">
        <div className="size-16 rounded-2xl border bg-background flex items-center justify-center">
          <Calendar className="size-7 text-muted-foreground/40" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Aucun événement trouvé</p>
          <p className="text-sm text-muted-foreground mt-1">Créez votre premier événement pour commencer.</p>
        </div>
        <button
          onClick={() => {
            const btn = document.querySelector('[data-create-event-btn]') as HTMLButtonElement;
            btn?.click();
          }}
          className="inline-flex items-center gap-2 bg-foreground hover:opacity-90 text-background rounded-xl px-5 py-2.5 text-sm font-medium transition-all shadow-sm"
        >
          <Plus className="size-4" strokeWidth={1.8} />
          Créer un événement
        </button>
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
                style={{ width: header.getSize() }}
                className="text-xs uppercase tracking-[0.15em] text-muted-foreground/80 font-medium px-2 py-2"
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
            onClick={() => window.location.href = `/dashboard/events/${row.original.id}`}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                className="px-2 py-2.5 text-sm"
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
