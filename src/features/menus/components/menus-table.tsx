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
  onAdd?: () => void;
  pagination: { page: number; totalPages: number };
  handlePageChange: (page: number) => void;
}

export function MenusTable({ data, loading, onEdit, onDelete, onAdd, pagination, handlePageChange }: MenusTableProps) {
  const columns = useMemo(() => menusColumns(onEdit, onDelete), []);

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
            <TableRow key={index}>
              {columns.map((col) => (
                <TableCell key={col.id} className="px-4 py-2">
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
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <p className="text-lg font-medium">Aucun menu trouvé</p>
        <p className="text-sm text-[#888888] mt-1">Commencez par créer un menu.</p>
        <button className="bg-[#C9A96E] text-white rounded-[0.75rem] px-5 py-2 font-medium hover:bg-[#b8975e]" onClick={onAdd}>
          Créer un menu
        </button>
      </div>
    );
  }

  return (
    <>
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
            <TableRow key={row.id} className="cursor-pointer hover:bg-[#f8f8f8] border-b border-[#e2e2e2]">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="px-4 py-2 text-sm">
                  {cell.getIsPlaceholder() ? null : flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 mt-4">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-3 py-1 bg-[#C9A96E] text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-[#888888]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="px-3 py-1 bg-[#C9A96E] text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
