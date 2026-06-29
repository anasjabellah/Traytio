'use client';

import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { menusColumns } from './menus-columns';
import { Menu } from '@/features/menus/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';

interface MenusTableProps {
  data: Menu[];
  loading: boolean;
  onEdit: (menu: Menu) => void;
  onDelete: (menu: Menu) => void;
  pagination: { page: number; totalPages: number; total: number; limit: number };
  handlePageChange: (page: number) => void;
  handleLimitChange: (limit: number) => void;
}

export function MenusTable({ data, loading, onEdit, onDelete, pagination, handlePageChange, handleLimitChange }: MenusTableProps) {
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
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        itemLabel="menu"
      />
    </>
  );
}
