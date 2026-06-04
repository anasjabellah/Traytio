'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useEvents } from '@/features/events/hooks/use-events';
import { useEventForm } from '@/features/events/hooks/use-event-form';
import { EventsTable } from '@/features/events/components/events-table';
import { EventToolbar } from '@/features/events/components/event-toolbar';
import { CreateEventDialog } from '@/features/events/components/create-event-dialog';
import { EditEventDialog } from '@/features/events/components/edit-event-dialog';
import { DeleteEventDialog } from '@/features/events/components/delete-event-dialog';
import { formatCurrency } from '@/lib/utils';

export default function EventsPage() {
  const { events, isLoading, error, pagination, handleSearch, handlePageChange, refresh } = useEvents();
  const {
    isCreateOpen,
    isEditOpen,
    isDeleteOpen,
    selectedEvent,
    openCreate,
    openEdit,
    openDelete,
    closeAll,
  } = useEventForm();

  const totalEvents = events.length;
  const totalBudget = events.reduce((sum, e) => sum + Number(e.budget), 0);
  const formattedBudget = formatCurrency(totalBudget);

  const handleView = (event: any) => {
    // Placeholder for view action – could navigate to detail page
    window.location.href = `/dashboard/events/${event.id}`;
  };

  const handleEdit = (event: any) => {
    openEdit(event);
  };

  const handleDelete = (event: any) => {
    openDelete(event);
  };

  return (
    <motion.main
      className="p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="mb-8">
        <h1 className="font-heading text-2xl font-medium">Événements</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
  <div className="border-l-2 border-[#C9A96E] p-6 bg-[#f8f8f8] border border-[#e2e2e2] rounded-xl">
    <p className="text-sm text-[#888888] mb-1">Total événements</p>
    <p className="text-2xl font-medium text-[#1a1a1a]">{totalEvents}</p>
  </div>
  <div className="border-l-2 border-[#C9A96E] p-6 bg-[#f8f8f8] border border-[#e2e2e2] rounded-xl">
    <p className="text-sm text-[#888888] mb-1">Budget total</p>
    <p className="text-2xl font-medium text-[#1a1a1a]">{formattedBudget}</p>
  </div>
</div>
<div className="mt-6 mb-6">
        <EventToolbar onSearch={handleSearch} onAddEvent={openCreate} totalCount={totalEvents} />
      </div>

      <EventsTable data={events} loading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Modals / Sheets */}
      <CreateEventDialog open={isCreateOpen} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      {isEditOpen && (
        <EditEventDialog event={selectedEvent} open={isEditOpen} onClose={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
      {isDeleteOpen && selectedEvent && (
        <DeleteEventDialog event={selectedEvent} open={true} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
    </motion.main>
  );
}
