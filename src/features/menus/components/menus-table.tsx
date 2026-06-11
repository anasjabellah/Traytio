'use client';

import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { menusColumns } from './menus-columns';
import { Menu } from '@/features/menus/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface MenusTableProps {
  data: Menu[];
  loading: boolean;
  onEdit: (menu: Menu) => void;
  onDelete: (menu: Menu) => void;
  pagination: { page: number; totalPages: number };
  handlePageChange: (page: number) => void;
}

export function MenusTable({ data, loading, onEdit, onDelete, pagination, handlePageChange }: MenusTableProps) {
  const columns = useMemo(() => menusColumns(onEdit, onDelete), []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <Table>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              {columns.map((col, colIndex) => (
                <TableCell key={`${col.id || colIndex}-${colIndex}`}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  const rowModel = table.getRowModel();

  if (rowModel.rows.length === 0 && !loading) {
    return null;
  }

  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-left text-[11px] uppercase tracking-[0.08em] text-muted-foreground/60 font-semibold">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rowModel.rows.map((row) => (
            <TableRow key={row.id} className="border-b border-border/40 hover:bg-foreground/[0.02] transition-colors">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-3 text-sm">
                  {cell.getIsPlaceholder() ? null : flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4 pb-4">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-4 py-2 rounded-xl bg-gradient-charcoal text-white text-sm font-medium disabled:opacity-40 transition-opacity"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground tabular-nums">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="px-4 py-2 rounded-xl bg-gradient-charcoal text-white text-sm font-medium disabled:opacity-40 transition-opacity"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
