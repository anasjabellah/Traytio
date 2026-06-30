'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PrivacyModeProvider } from '@/components/privacy-mode';
import { useEvents } from '@/features/events/hooks/use-events';
import { useEventForm } from '@/features/events/hooks/use-event-form';
import { useEventsFilters } from '@/features/events/hooks/use-events-filters';
import { EVENT_DEFAULT_PAGE_SIZE } from '@/features/events/constants';
import { EventsHeader } from '@/features/events/components/EventsHeader';
import { EventsStats } from '@/features/events/components/EventsStats';
import { EventsFilters } from '@/features/events/components/EventsFilters';
import { EventsGrid } from '@/features/events/components/EventsGrid';
import { EventsSidebar } from '@/features/events/components/EventsSidebar';
import { EventsCalendar } from '@/features/events/components/EventsCalendar';
import { CreateEventDialog } from '@/features/events/components/create-event-dialog';
import { EditEventDialog } from '@/features/events/components/edit-event-dialog';
import { DeleteEventDialog } from '@/features/events/components/delete-event-dialog';
import type { Event } from '@/features/events/types';
import type { ViewMode } from '@/features/events/constants';

export default function EventsPage() {
  const router = useRouter();
  const {
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    paymentFilter, setPaymentFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    budgetMin, setBudgetMin,
    budgetMax, setBudgetMax,
    filterParams,
    resetFilters,
  } = useEventsFilters();
  const { isCreateOpen, isEditOpen, isDeleteOpen, selectedEvent, openCreate, openEdit, openDelete, closeAll } = useEventForm();

  const {
    events, isLoading, pagination, handleSearch, handlePageChange, handleLimitChange, refresh,
    KPIS, todayEvents, upcomingSorted, STATS_EVENTS, totalBudget,
  } = useEvents(EVENT_DEFAULT_PAGE_SIZE, filterParams);

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showFilters, setShowFilters] = useState(false);

  const displayEvents = useMemo(() => {
    if (!paymentFilter) return events;
    return events.filter(e => e.paymentStatus === paymentFilter);
  }, [events, paymentFilter]);

  const searchMounted = useRef(false);
  useEffect(() => {
    if (!searchMounted.current) {
      searchMounted.current = true;
      return;
    }
    const timer = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleView = useCallback((event: Event) => { router.push(`/dashboard/events/${event.id}`); }, [router]);

  return (
    <PrivacyModeProvider>
      <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
        <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
        <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

        <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
          <EventsHeader
            total={pagination.total}
            events={events}
            onCreate={openCreate}
          />

          <EventsStats kpis={KPIS} />

          <EventsFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearSearch={() => { setSearchQuery(''); handleSearch(''); }}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            paymentFilter={paymentFilter}
            onPaymentFilterChange={setPaymentFilter}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            budgetMin={budgetMin}
            onBudgetMinChange={setBudgetMin}
            budgetMax={budgetMax}
            onBudgetMaxChange={setBudgetMax}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((s) => !s)}
            onRefresh={refresh}
            onResetFilters={resetFilters}
            filteredCount={displayEvents.length}
          />

          {viewMode === 'calendar' ? (
            <EventsCalendar
              events={displayEvents}
              isLoading={isLoading}
              onView={handleView}
              onEdit={openEdit}
            />
          ) : (
            <div className="mt-8 grid grid-cols-12 gap-6">
              <EventsGrid
                events={displayEvents}
                isLoading={isLoading}
                statusFilter={statusFilter}
                onEdit={openEdit}
                onDelete={openDelete}
                upcomingSorted={upcomingSorted}
                pagination={pagination}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
              <EventsSidebar
                todayEvents={todayEvents}
                statsEvents={STATS_EVENTS}
                totalBudget={totalBudget}
              />
            </div>
          )}

          <footer className="mt-16 mb-6 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              Tous les services opérationnels
            </div>
            <div>© TUR — Suite traiteur premium</div>
          </footer>
        </div>

        <CreateEventDialog open={isCreateOpen} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
        {isEditOpen && (
          <EditEventDialog event={selectedEvent} open={isEditOpen} onClose={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
        )}
        {isDeleteOpen && selectedEvent && (
          <DeleteEventDialog event={selectedEvent} open={true} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
        )}
      </div>
    </PrivacyModeProvider>
  );
}
