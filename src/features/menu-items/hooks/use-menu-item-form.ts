'use client';

import { useState, useCallback } from 'react';
import { notify } from '@/lib/notify';
import { MENU_ITEM } from '@/lib/notify/messages';
import type { MenuItem } from '@/features/menu-items/types';
import { updateMenuItem } from '@/features/menu-items/actions/update-menu-item';
import { createMenuItem } from '@/features/menu-items/actions/create-menu-item';

export function useMenuItemForm() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const openCreate = () => {
    setIsCreateOpen(true);
    setSelectedItem(null);
  };

  const openEdit = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  }, []);

  const openDelete = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  }, []);

  const openDuplicate = useCallback(async (item: MenuItem) => {
    if (isDuplicating) return;
    setIsDuplicating(true);
    try {
      const resp = await createMenuItem({
        name: `${item.name} (copie)`,
        category: item.category,
        unitPrice: Number(item.unitPrice),
        unit: item.unit ?? undefined,
        isActive: false,
        notes: item.notes ?? undefined,
        imageUrl: item.imageUrl ?? undefined,
      });
      if (resp.success) {
        notify.success(MENU_ITEM.DUPLICATE.SUCCESS);
      } else {
        notify.error(resp.error ?? MENU_ITEM.DUPLICATE.ERROR);
      }
    } catch {
      notify.error(MENU_ITEM.UNEXPECTED_ERROR);
    } finally {
      setIsDuplicating(false);
    }
  }, [isDuplicating]);

  const openArchive = useCallback(async (item: MenuItem) => {
    try {
      const resp = await updateMenuItem({
        id: item.id,
        isActive: !item.isActive,
      });
      if (resp.success) {
        notify.success(item.isActive ? MENU_ITEM.ARCHIVE.SUCCESS_ARCHIVED : MENU_ITEM.ARCHIVE.SUCCESS_REACTIVATED);
      } else {
        notify.error(resp.error ?? MENU_ITEM.ARCHIVE.ERROR);
      }
    } catch {
      notify.error(MENU_ITEM.UNEXPECTED_ERROR);
    }
  }, []);

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
    openDuplicate,
    openArchive,
    closeAll,
  } as const;
}
