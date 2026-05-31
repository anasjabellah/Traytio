// src/features/menu-items/hooks/use-menu-item-form.ts

'use client';

import { useState } from 'react';
import type { MenuItem } from '@/features/menu-items/types';

/**
 * Hook to manage UI state for menu‑item creation, editing and deletion dialogs.
 * Mirrors the `useMenuForm` hook used for menus.
 */
export function useMenuItemForm() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const openCreate = () => {
    setIsCreateOpen(true);
    setSelectedItem(null);
  };

  const openEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const openDelete = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const closeAll = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setSelectedItem(null);
  };

  return {
    isCreateOpen,
    isEditOpen,
    isDeleteOpen,
    selectedItem,
    openCreate,
    openEdit,
    openDelete,
    closeAll,
  } as const;
}
