'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useClients } from '@/features/clients/hooks/use-clients';
import { useClientForm } from '@/features/clients/hooks/use-client-form';
import { useClientsFilters } from '@/features/clients/hooks/use-clients-filters';
import { useClientsStats } from '@/features/clients/hooks/use-clients-stats';
import { ClientsHeader } from '@/features/clients/components/ClientsHeader';
import { ClientsStats } from '@/features/clients/components/ClientsStats';
import { ClientsToolbar } from '@/features/clients/components/ClientsToolbar';
import { ClientsGrid } from '@/features/clients/components/ClientsGrid';
import { ClientsSidebar } from '@/features/clients/components/ClientsSidebar';
import { CreateClientDialog } from '@/features/clients/components/create-client-dialog';
import { EditClientDialog } from '@/features/clients/components/edit-client-dialog';
import { DeleteClientDialog } from '@/features/clients/components/delete-client-dialog';
import { PrivacyModeProvider, usePrivacyMode } from '@/components/privacy-mode';
import type { ClientWithStats, Client } from '@/features/clients/types';

export default function ClientsPage() {
  const router = useRouter();
  const { clients, isLoading, pagination, handleSearch, refresh } = useClients();
  const {
    isCreateOpen, isEditOpen, isDeleteOpen, selectedClient,
    openCreate, openEdit, openDelete, closeAll,
  } = useClientForm();

  const {
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    showFilters, setShowFilters,
    viewMode, setViewMode,
    filteredClients,
  } = useClientsFilters(clients);

  const {
    stats, activities,
    totalRevenue, avgValue, activePct, totalCommandes,
    KPIS, recentClients, topCity,
  } = useClientsStats(clients, pagination.total);

  const { isPrivacyMode } = usePrivacyMode();

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleView = useCallback((client: ClientWithStats) => {
    router.push(`/dashboard/clients/${client.id}`);
  }, [router]);

  const isSearching = searchQuery.length > 0;
  const hasNoResults = !isLoading && isSearching && filteredClients.length === 0;
  const hasNoClients = !isLoading && !isSearching && clients.length === 0;

  return (
    <PrivacyModeProvider>
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        <ClientsHeader
          clients={clients}
          total={pagination.total}
          onCreate={openCreate}
        />

        <ClientsStats kpis={KPIS} isPrivacyMode={isPrivacyMode} />

        <ClientsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((s) => !s)}
          onRefresh={refresh}
        />

        {!isPrivacyMode && (
        <div className="mt-8 flex gap-6">
          <ClientsGrid
            viewMode={viewMode}
            filteredClients={filteredClients}
            isLoading={isLoading}
            onView={handleView}
            onEdit={openEdit}
            onDelete={openDelete}
            recentClients={recentClients}
            stats={stats}
            totalRevenue={totalRevenue}
            avgValue={avgValue}
            activePct={activePct}
            totalCommandes={totalCommandes}
            hasNoClients={hasNoClients}
            hasNoResults={hasNoResults}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onAdd={openCreate}
          />
          <ClientsSidebar
            activities={activities}
            stats={stats}
            avgValue={avgValue}
            activePct={activePct}
            topCity={topCity}
            growthRate={stats?.growthRate ?? 0}
          />
        </div>
        )}

        <footer className="mt-16 mb-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Tous les services op&eacute;rationnels
          </div>
          <div>&copy; TUR &mdash; Suite traiteur premium</div>
        </footer>
      </div>

      <CreateClientDialog open={isCreateOpen} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      {isEditOpen && selectedClient && (
        <EditClientDialog client={selectedClient as unknown as Client} open={true} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
      {isDeleteOpen && selectedClient && (
        <DeleteClientDialog client={selectedClient} open={true} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
    </div>
    </PrivacyModeProvider>
  );
}
