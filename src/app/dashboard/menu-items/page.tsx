// src/app/dashboard/menu-items/page.tsx

'use client';

import { motion } from 'framer-motion';
import { useMenuItems } from '@/features/menu-items/hooks/use-menu-items';
import { useMenuItemForm } from '@/features/menu-items/hooks/use-menu-item-form';
import { MenuItemsTable } from '@/features/menu-items/components/menu-items-table';
import { MenuItemToolbar } from '@/features/menu-items/components/menu-item-toolbar';
import { CreateMenuItemDialog } from '@/features/menu-items/components/create-menu-item-dialog';
import { EditMenuItemDialog } from '@/features/menu-items/components/edit-menu-item-dialog';
import { DeleteMenuItemDialog } from '@/features/menu-items/components/delete-menu-item-dialog';
import type { MenuItem } from '@/features/menu-items/types';

export default function MenuItemsPage() {
  const { items, isLoading, error, pagination, handleSearch, handlePageChange, refresh } = useMenuItems();
  const {
    isCreateOpen,
    isEditOpen,
    isDeleteOpen,
    selectedItem,
    openCreate,
    openEdit,
    openDelete,
    closeAll,
  } = useMenuItemForm();

  const totalItems = pagination.total ?? 0;
  const activeCount = items.filter(item => item.isActive).length;
  const totalPrice = items.reduce((sum, i) => sum + Number(i.unitPrice), 0);
  const averagePrice = items.length ? totalPrice / items.length : 0;
  const formattedAverage = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
  }).format(averagePrice);
  const formattedTotalPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
  }).format(totalPrice);

  const handleEdit = (item: MenuItem) => {
    openEdit(item);
  };

  const handleDelete = (item: MenuItem) => {
    openDelete(item);
  };

  return (
    <motion.main
      className="p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="mb-8">
        <h1 className="font-heading text-2xl font-medium">Articles</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border-l-2 border-[#C9A96E] p-6 bg-[#f8f8f8] border border-[#e2e2e2] rounded-xl">
          <p className="text-sm text-[#888888] mb-1">Total articles</p>
          <p className="text-2xl font-medium text-[#1a1a1a]">{totalItems}</p>
        </div>
        <div className="border-l-2 border-[#C9A96E] p-6 bg-[#f8f8f8] border border-[#e2e2e2] rounded-xl">
          <p className="text-sm text-[#888888] mb-1">Valeur totale (MAD)</p>
          <p className="text-2xl font-medium text-[#1a1a1a]">{formattedTotalPrice}</p>
        </div>
      </div>

      <div className="mt-6 mb-6">
        <MenuItemToolbar onSearch={handleSearch} onAddItem={openCreate} totalCount={totalItems} />
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <MenuItemsTable data={items} loading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Modals */}
      <CreateMenuItemDialog
        open={isCreateOpen}
        onOpenChange={open => {
          if (!open) closeAll();
        }}
        onSuccess={refresh}
      />
      {isEditOpen && selectedItem && (
        <EditMenuItemDialog
          item={selectedItem}
          open={isEditOpen}
          onClose={open => {
            if (!open) closeAll();
          }}
          onSuccess={refresh}
        />
      )}
      {isDeleteOpen && selectedItem && (
        <DeleteMenuItemDialog
          item={selectedItem}
          open={true}
          onOpenChange={open => {
            if (!open) closeAll();
          }}
          onSuccess={refresh}
        />
      )}
    </motion.main>
  );
}