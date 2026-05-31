'use client';

import { useState } from 'react';
import type { Event } from '@/features/events/types';

/**
 * Hook to manage the UI state for event creation, editing, and deletion.
 * Provides booleans for each dialog and the currently selected event.
 */
export function useEventForm() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const openCreate = () => {
    setIsCreateOpen(true);
    setSelectedEvent(null);
  };

  const openEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsEditOpen(true);
  };

  const openDelete = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteOpen(true);
  };

  const closeAll = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setSelectedEvent(null);
  };

  return {
    isCreateOpen,
    isEditOpen,
    isDeleteOpen,
    selectedEvent,
    openCreate,
    openEdit,
    openDelete,
    closeAll,
  } as const;
}