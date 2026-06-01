// src/app/dashboard/menu-items/page.tsx

'use client';

import { motion } from 'framer-motion';
import { useMenuItems } from '@/features/menu-items/hooks/use-menu-items';
import { useState } from 'react';
import { useMenuItemForm } from '@/features/menu-items/hooks/use-menu-item-form';
import { MenuItemsTable } from '@/features/menu-items/components/menu-items-table';
import { MenuItemToolbar } from '@/features/menu-items/components/menu-item-toolbar';
import { CreateMenuItemDialog } from '@/features/menu-items/components/create-menu-item-dialog';
import { EditMenuItemDialog } from '@/features/menu-items/components/edit-menu-item-dialog';
import { DeleteMenuItemDialog } from '@/features/menu-items/components/delete-menu-item-dialog';
import type { MenuItem } from '@/features/menu-items/types';

export default function MenuItemsPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const { items, isLoading, error, pagination, handleSearch, handlePageChange, refresh, handleCategoryChange } = useMenuItems();
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
      {/* Category filter badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'ALL', label: 'Tous' },
          { key: 'FOOD', label: 'Aliment' },
          { key: 'DRINKS', label: 'Boisson' },
          { key: 'DESSERTS', label: 'Dessert' },
          { key: 'DECORATION', label: 'Décoration' },
          { key: 'STAFF', label: 'Personnel' },
          { key: 'ENTERTAINMENT', label: 'Divertissement' },
          { key: 'EXTRAS', label: 'Extras' },
        ].map(cat => (
          <button
            key={cat.key}
            type="button"
            className={
              selectedCategory === cat.key
                ? 'bg-[#C9A96E] text-white rounded-full px-3 py-1 text-sm'
                : 'border border-[#e2e2e2] text-[#888888] rounded-full px-3 py-1 text-sm hover:border-[#C9A96E]'
            }
            onClick={() => {
              setSelectedCategory(cat.key);
              handleCategoryChange(cat.key);
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <MenuItemsTable data={items} loading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />
        {/* Pagination controls */}
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