'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
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
        toast.success('Article dupliqué avec succès');
      } else {
        toast.error(resp.error ?? 'Erreur lors de la duplication');
      }
    } catch {
      toast.error('Erreur inattendue');
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
        toast.success(item.isActive ? 'Article archivé' : 'Article réactivé');
      } else {
        toast.error(resp.error ?? 'Erreur');
      }
    } catch {
      toast.error('Erreur inattendue');
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
