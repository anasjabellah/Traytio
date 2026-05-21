'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useClients } from '@/features/clients/hooks/use-clients';
import { useClientForm } from '@/features/clients/hooks/use-client-form';
import { ClientsTable } from '@/features/clients/components/clients-table';
import { ClientsToolbar } from '@/features/clients/components/clients-toolbar';
import { CreateClientDialog } from '@/features/clients/components/create-client-dialog';
import { EditClientDialog } from '@/features/clients/components/edit-client-dialog';
import { DeleteClientDialog } from '@/features/clients/components/delete-client-dialog';

export default function ClientsPage() {
  const { clients, isLoading, error, pagination, handleSearch, handlePageChange, refresh } = useClients();
  const {
  isCreateOpen,
  isEditOpen,
  isDeleteOpen,
  selectedClient,
  openCreate,
  openEdit,
  openDelete,
  closeAll
} = useClientForm();

  const totalClients = clients.length;
  const totalRevenue = clients.reduce((sum, c) => sum + Number(c.totalSpent), 0);

  const handleView = (client: any) => {
    // Navigate to client detail page
    // Using Next router client-side navigation
    window.location.href = `/dashboard/clients/${client.id}`;
  };

  const handleEdit = (client: any) => {
    openEdit(client);
  };

  const handleDelete = (client: any) => {
    openDelete(client);
  };

  return (
    <motion.main
      className="p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="mb-8">
        <h1 className="font-heading text-2xl font-medium">Clients</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border-l-2 border-[#C9A96E] p-6 bg-[#f8f8f8] border border-[#e2e2e2] rounded-xl">
          <p className="text-sm text-[#888888] mb-1">Total clients</p>
          <p className="text-2xl font-medium text-[#1a1a1a]">{totalClients}</p>
        </div>
        <div className="border-l-2 border-[#C9A96E] p-6 bg-[#f8f8f8] border border-[#e2e2e2] rounded-xl">
          <p className="text-sm text-[#888888] mb-1">Total revenue</p>
          <p className="text-2xl font-medium text-[#1a1a1a]">${totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <ClientsToolbar onSearch={handleSearch} onAddClient={openCreate} totalCount={totalClients} />

      <ClientsTable
        data={clients}
        loading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Pagination controls could be added here */}

      {/* Modals / Sheets */}
      <CreateClientDialog open={isCreateOpen} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      {isEditOpen && selectedClient && (
        <EditClientDialog client={selectedClient} open={true} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
      {isDeleteOpen && selectedClient && (
        <DeleteClientDialog client={selectedClient} open={true} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
    </motion.main>
  );
}
