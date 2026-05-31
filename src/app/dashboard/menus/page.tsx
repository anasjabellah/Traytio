'use client';

import { motion } from 'framer-motion';
import { useMenus } from '@/features/menus/hooks/use-menus';
import { useMenuForm } from '@/features/menus/hooks/use-menu-form';
import { MenusTable } from '@/features/menus/components/menus-table';
import { MenuToolbar } from '@/features/menus/components/menu-toolbar';
import { CreateMenuDialog } from '@/features/menus/components/create-menu-dialog';
import { EditMenuDialog } from '@/features/menus/components/edit-menu-dialog';
import { DeleteMenuDialog } from '@/features/menus/components/delete-menu-dialog';

export default function MenusPage() {
  const { menus, isLoading, error, pagination, handleSearch, handlePageChange, refresh } = useMenus();
  const {
    isCreateOpen,
    isEditOpen,
    isDeleteOpen,
    selectedMenu,
    openCreate,
    openEdit,
    openDelete,
    closeAll,
  } = useMenuForm();

  const totalMenus = menus.length;
  const totalPrice = menus.reduce((sum, m) => sum + Number(m.pricePerPerson), 0);
  const averagePrice = totalMenus ? totalPrice / totalMenus : 0;
  const formattedAverage = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(averagePrice);

  const handleEdit = (menu: any) => {
    openEdit(menu);
  };

  const handleDelete = (menu: any) => {
    openDelete(menu);
  };

  return (
    <motion.main
      className="p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="mb-8">
        <h1 className="font-heading text-2xl font-medium">Menus</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border-l-2 border-[#C9A96E] p-6 bg-[#f8f8f8] border border-[#e2e2e2] rounded-xl">
          <p className="text-sm text-[#888888] mb-1">Total menus</p>
          <p className="text-2xl font-medium text-[#1a1a1a]">{totalMenus}</p>
        </div>
        <div className="border-l-2 border-[#C9A96E] p-6 bg-[#f8f8f8] border border-[#e2e2e2] rounded-xl">
          <p className="text-sm text-[#888888] mb-1">Prix moyen</p>
          <p className="text-2xl font-medium text-[#1a1a1a]">{formattedAverage}</p>
        </div>
      </div>

      <div className="mt-6 mb-6">
        <MenuToolbar onSearch={handleSearch} onAddMenu={openCreate} totalCount={totalMenus} />
      </div>

      <MenusTable data={menus} loading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Modals */}
      <CreateMenuDialog open={isCreateOpen} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      {isEditOpen && (
        <EditMenuDialog menu={selectedMenu} open={isEditOpen} onClose={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
      {isDeleteOpen && selectedMenu && (
        <DeleteMenuDialog menu={selectedMenu} open={true} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
    </motion.main>
  );
}
