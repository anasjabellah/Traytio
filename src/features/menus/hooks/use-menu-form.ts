'use client';

import { useState } from 'react';
import type { Menu } from '@/features/menus/types';

/**
 * Hook to manage UI state for menu creation, editing and deletion dialogs.
 * Mirrors useEventForm but for menus.
 */
export function useMenuForm() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  const openCreate = () => {
    setIsCreateOpen(true);
    setSelectedMenu(null);
  };

  const openEdit = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsEditOpen(true);
  };

  const openDelete = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsDeleteOpen(true);
  };

  const closeAll = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setSelectedMenu(null);
  };

  return {
    isCreateOpen,
    isEditOpen,
    isDeleteOpen,
    selectedMenu,
    openCreate,
    openEdit,
    openDelete,
    closeAll,
  } as const;
}
