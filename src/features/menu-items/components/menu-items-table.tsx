'use client';

import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { menuItemsColumns } from './menu-items-columns';
import { MenuItem } from '@/features/menu-items/types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';

interface MenuItemsTableProps {
  data: MenuItem[];
  loading: boolean;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onDuplicate: (item: MenuItem) => void;
  onArchive: (item: MenuItem) => void;
  pagination: { page: number; totalPages: number; total: number; limit: number };
  handlePageChange: (page: number) => void;
  handleLimitChange: (limit: number) => void;
}

export function MenuItemsTable({ data, loading, onEdit, onDelete, onDuplicate, onArchive, pagination, handlePageChange, handleLimitChange }: MenuItemsTableProps) {
  const columns = useMemo(
    () => menuItemsColumns(onEdit, onDelete, onDuplicate, onArchive),
    [onEdit, onDelete, onDuplicate, onArchive],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id} className="text-xs uppercase tracking-wider text-muted-foreground font-medium h-10">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {columns.map((col, ci) => (
                <TableCell key={`${col.id || ci}-${ci}`} className="py-3">
                  <div className="h-3.5 bg-foreground/[0.06] rounded w-full animate-pulse" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  const rowModel = table.getRowModel();

  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id} className="text-xs uppercase tracking-wider text-muted-foreground font-medium h-10">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rowModel.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
                Aucun article trouvé
              </TableCell>
            </TableRow>
          ) : (
            rowModel.rows.map(row => (
              <TableRow key={row.id} className="border-b border-border/50 hover:bg-foreground/[0.02] transition-colors">
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} className="py-3 text-sm">
                    {cell.getIsPlaceholder() ? null : flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          itemLabel="article"
        />
      )}
    </>
  );
}
