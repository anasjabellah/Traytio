// src/features/menu-items/components/menu-items-table.tsx

'use client';

import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { menuItemsColumns } from './menu-items-columns';
import { MenuItem } from '@/features/menu-items/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface MenuItemsTableProps {
  data: MenuItem[];
  loading: boolean;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
}

export function MenuItemsTable({ data, loading, onEdit, onDelete }: MenuItemsTableProps) {
  const columns = useMemo(() => menuItemsColumns(onEdit, onDelete), []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <Table className="mt-4">
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {columns.map(col => (
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
        <p className="text-lg font-medium">Aucun article trouvé</p>
        <p className="text-sm text-[#888888] mt-1">Commencez par créer un article.</p>
        <button className="bg-[#C9A96E] text-white rounded-[0.75rem] px-5 py-2 font-medium hover:bg-[#b8975e]">
          Créer un article
        </button>
      </div>
    );
  }

  return (
    <>
      <Table className="mt-4">
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
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
          {rowModel.rows.map(row => (
            <TableRow key={row.id} className="cursor-pointer hover:bg-[#f8f8f8] border-b border-[#e2e2e2]">
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id} className="px-4 py-2 text-sm">
                  {cell.getIsPlaceholder() ? null : flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
