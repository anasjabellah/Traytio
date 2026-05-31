'use client';

import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, Row } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { eventsColumns } from './events-columns';
import { Event } from '@/features/events/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface EventsTableProps {
  data: Event[];
  loading: boolean;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
}

export function EventsTable({ data, loading, onEdit, onDelete }: EventsTableProps) {
  const columns = useMemo(() => eventsColumns(onEdit, onDelete), []);

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
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              {columns.map((column) => (
                <TableCell key={column.id} className="px-4 py-2">
                  <Skeleton className="h-4 w-full" />
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
      <div className="py-20 flex flex-col items-center gap-4">
        <p className="text-lg font-medium">Aucun événement trouvé</p>
        <p className="text-sm text-[#888888] mt-1">Commencez par créer un événement.</p>
        <button className="bg-[#C9A96E] text-white rounded-[0.75rem] px-5 py-2 font-medium hover:bg-[#b8975e]">
          Créer un événement
        </button>
      </div>
    );
  }

  return (
    <Table className="mt-4">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                className="text-left text-xs uppercase tracking-wider text-[#888888] font-medium"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.4 }}
            className="cursor-pointer hover:bg-[#f8f8f8] border-b border-[#e2e2e2]"
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="px-4 py-2 text-sm">
                {cell.getIsPlaceholder() ? null : flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
            {/* Actions column handled in events-columns */}
          </motion.tr>
        ))}
      </TableBody>
    </Table>
  );
}
