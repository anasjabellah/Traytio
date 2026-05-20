'use client';

import { useState } from 'react';
import type { ClientWithStats } from '@/features/clients/types';

/**
 * Hook to manage the UI state for client creation, editing, and deletion.
 * Provides booleans for each sheet/dialog and the currently selected client.
 */
export function useClientForm() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);

  const openCreate = () => {
    setIsCreateOpen(true);
    setSelectedClient(null);
  };

  const openEdit = (client: ClientWithStats) => {
    setSelectedClient(client);
    setIsEditOpen(true);
  };

  const openDelete = (client: ClientWithStats) => {
    setSelectedClient(client);
    setIsDeleteOpen(true);
  };

  const closeAll = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setSelectedClient(null);
  };

  return {
    isCreateOpen,
    isEditOpen,
    isDeleteOpen,
    selectedClient,
    openCreate,
    openEdit,
    openDelete,
    closeAll,
  } as const;
}
