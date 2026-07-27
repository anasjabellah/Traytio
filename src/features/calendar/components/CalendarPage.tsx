'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, CalendarCheck, CalendarRange, Wallet, Banknote } from 'lucide-react'
import { notify } from '@/lib/notify'
import { EVENT } from '@/lib/notify/messages'
import { motion } from 'framer-motion'
import { PrivacyModeProvider } from '@/components/privacy-mode'
import { useCalendarData } from '@/features/calendar/hooks/use-calendar-data'
import type { CalendarInitialData } from '@/features/calendar/hooks/use-calendar-data'
import { EventManager } from '@/components/ui/event-manager'
import type { CalendarEvent } from '@/components/ui/event-manager'
import { MiniCalendar } from '@/features/dashboard/components/MiniCalendar'
import dynamic from 'next/dynamic'
const EventDetailSheet = dynamic(() => import('@/features/calendar/components/EventDetailSheet').then((m) => m.EventDetailSheet), { loading: () => null })
const CreateEventDialog = dynamic(() => import('@/features/events/components/create-event-dialog').then((m) => m.CreateEventDialog), { loading: () => null })
const DeleteEventDialog = dynamic(() => import('@/features/events/components/delete-event-dialog').then((m) => m.DeleteEventDialog), { loading: () => null })
import { EventsHeader } from '@/features/events/components/EventsHeader'
import { EventsStats } from '@/features/events/components/EventsStats'
import { EventsFilters } from '@/features/events/components/EventsFilters'
import { computeKpi } from '@/features/dashboard/lib/kpi-engine'
import { updateEvent } from '@/features/events/actions/update-event'
import { duplicateEvent } from '@/features/events/actions/duplicate-event'
import type { Event } from '@/features/events/types'
import { EVENT_TYPE_LABELS } from '@/features/events/constants'

const eventTypeToColor: Record<string, string> = {
  WEDDING: 'rose',
  CORPORATE: 'blue',
  BIRTHDAY: 'purple',
  ANNIVERSARY: 'amber',
  HOLIDAY: 'orange',
  OTHER: 'gray',
}

const eventColors = [
  { name: 'Mariage', value: 'rose', bg: 'bg-rose-500', text: 'text-rose-700' },
  { name: 'Corporate', value: 'blue', bg: 'bg-blue-500', text: 'text-blue-700' },
  { name: 'Anniversaire', value: 'purple', bg: 'bg-purple-500', text: 'text-purple-700' },
  { name: 'Anniversaire', value: 'amber', bg: 'bg-amber-500', text: 'text-amber-700' },
  { name: 'Gala', value: 'orange', bg: 'bg-orange-500', text: 'text-orange-700' },
  { name: 'Autre', value: 'gray', bg: 'bg-gray-500', text: 'text-gray-700' },
]

function eventToCalendarEvent(event: Event): CalendarEvent {
  const color = eventTypeToColor[event.type] || 'gray'
  return {
    id: event.id,
    title: event.name,
    description: event.notes || event.location || undefined,
    startTime: new Date(event.startDate),
    endTime: event.endDate ? new Date(event.endDate) : new Date(event.startDate),
    color,
    category: EVENT_TYPE_LABELS[event.type] || 'Autre',
    tags: event.clientName ? [event.clientName] : undefined,
  }
}

export function CalendarPage({ initialData }: { initialData?: CalendarInitialData | null }) {
  const router = useRouter()
  const {
    events, allEvents, loading, error, stats, filters, setFilters, setDateRange, refresh, everHadEvents,
  } = useCalendarData(initialData)

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createDefaults, setCreateDefaults] = useState<Record<string, unknown> | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)

  const [paymentFilter, setPaymentFilter] = useState<string | null>(null)
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [budgetMinFilter, setBudgetMinFilter] = useState('')
  const [budgetMaxFilter, setBudgetMaxFilter] = useState('')

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      paymentStatus: paymentFilter || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      budgetMin: budgetMinFilter ? Number(budgetMinFilter) : undefined,
      budgetMax: budgetMaxFilter ? Number(budgetMaxFilter) : undefined,
    }))
  }, [paymentFilter, dateFromFilter, dateToFilter, budgetMinFilter, budgetMaxFilter, setFilters])

  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput || undefined }))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, setFilters])

  useEffect(() => {
    if (!filters.search) setSearchInput('')
  }, [filters.search])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable
      if (isInput) return

      switch (e.key) {
        case 'N':
        case 'n':
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setCreateDefaults(undefined); setCreateOpen(true) }
          break
        case 'Escape':
          setSheetOpen(false)
          break
        case 'Enter':
          if (selectedEvent && !sheetOpen) {
            e.preventDefault()
            setSheetOpen(true)
          }
          break
        case 'Delete':
          if (selectedEvent && !deleteTarget) {
            e.preventDefault()
            setDeleteTarget(selectedEvent)
          }
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedEvent, sheetOpen, deleteTarget])

  const handleEventClick = useCallback((event: Event) => {
    setSelectedEvent(event)
    setSheetOpen(true)
  }, [])

  const handleCalendarEventClick = useCallback((calendarEvent: CalendarEvent) => {
    const event = allEvents.find((e) => e.id === calendarEvent.id)
    if (event) handleEventClick(event)
  }, [allEvents, handleEventClick])

  const handleEventUpdate = useCallback(async (id: string, updated: Partial<CalendarEvent>) => {
    const result = await updateEvent({
      id,
      startDate: updated.startTime instanceof Date ? updated.startTime.toISOString() : undefined,
      endDate: updated.endTime instanceof Date ? updated.endTime.toISOString() : undefined,
    } as unknown as Record<string, unknown>)
    if (result.success) {
      notify.success(EVENT.DRAG.DROP_SUCCESS)
      refresh()
    } else {
      notify.error(result.error || EVENT.DRAG.DROP_ERROR)
    }
  }, [refresh])

  const handleEdit = useCallback((event: Event) => {
    setSheetOpen(false)
    router.push(`/dashboard/events/${event.id}`)
  }, [router])

  const handleDeleteRequest = useCallback((event: Event) => {
    setSheetOpen(false)
    setTimeout(() => setDeleteTarget(event), 300)
  }, [])

  const handleDuplicate = useCallback(async (event: Event) => {
    const result = await duplicateEvent(event.id)
    if (result.success) {
      notify.success(EVENT.DUPLICATE.SUCCESS)
      refresh()
    } else {
      notify.error(result.error || EVENT.DUPLICATE.ERROR)
    }
  }, [refresh])

  const handleOpenEvent = useCallback((event: Event) => {
    setSheetOpen(false)
    router.push(`/dashboard/events/${event.id}`)
  }, [router])

  const totalKpi = useMemo(() => computeKpi(stats.perfTotal), [stats.perfTotal])
  const weekKpi = useMemo(() => computeKpi(stats.perfWeek), [stats.perfWeek])
  const monthKpi = useMemo(() => computeKpi(stats.perfMonth), [stats.perfMonth])
  const budgetKpi = useMemo(() => computeKpi(stats.perfBudget), [stats.perfBudget])
  const paymentsKpi = useMemo(() => computeKpi(stats.perfPayments), [stats.perfPayments])

  const KPIS = useMemo(() => [
    { label: 'Événements', value: stats.totalEvents, icon: Calendar, sensitive: false, ...totalKpi },
    { label: 'Cette semaine', value: stats.thisWeek, icon: CalendarCheck, sensitive: false, ...weekKpi },
    { label: 'Ce mois', value: stats.thisMonth, icon: CalendarRange, sensitive: false, ...monthKpi },
    { label: 'Budget total', value: stats.totalBudget, prefix: 'MAD', icon: Wallet, sensitive: true, ...budgetKpi },
    { label: 'Encaissé', value: stats.totalPaid, prefix: 'MAD', icon: Banknote, sensitive: true, ...paymentsKpi },
  ], [stats, totalKpi, weekKpi, monthKpi, budgetKpi, paymentsKpi])

  const calendarEvents = useMemo(() => events.map(eventToCalendarEvent), [events])
  const eventCategories = useMemo(() => Object.values(EVENT_TYPE_LABELS), [])

  if (error && allEvents.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
        <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
        <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />
        <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="size-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4">
              <Calendar className="size-7 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground/70 max-w-sm mb-6">{error}</p>
            <button
              onClick={refresh}
              className="h-9 px-4 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold/90 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PrivacyModeProvider>
      <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
        <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
        <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

        <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <EventsHeader
              total={allEvents.length}
              events={allEvents}
              onCreate={() => { setCreateDefaults(undefined); setCreateOpen(true) }}
              title="Calendrier"
              subtitle="Planifiez, visualisez et gérez tous vos événements en un seul endroit."
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
            <EventsStats kpis={KPIS} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <EventsFilters
              searchQuery={searchInput}
              onSearchChange={setSearchInput}
              onClearSearch={() => { setSearchInput(''); setFilters((prev) => ({ ...prev, search: undefined })) }}
              statusFilter={filters.status || null}
              onStatusFilterChange={(v) => setFilters((prev) => ({ ...prev, status: v || undefined }))}
              typeFilter={filters.type || null}
              onTypeFilterChange={(v) => setFilters((prev) => ({ ...prev, type: v || undefined }))}
              paymentFilter={paymentFilter}
              onPaymentFilterChange={setPaymentFilter}
              dateFrom={dateFromFilter}
              onDateFromChange={setDateFromFilter}
              dateTo={dateToFilter}
              onDateToChange={setDateToFilter}
              budgetMin={budgetMinFilter}
              onBudgetMinChange={setBudgetMinFilter}
              budgetMax={budgetMaxFilter}
              onBudgetMaxChange={setBudgetMaxFilter}
              viewMode="calendar"
              onViewModeChange={(v) => { if (v === 'table') router.push('/dashboard/events') }}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
              onRefresh={refresh}
              onResetFilters={() => { setFilters({}); setSearchInput(''); setPaymentFilter(null); setDateFromFilter(''); setDateToFilter(''); setBudgetMinFilter(''); setBudgetMaxFilter('') }}
              filteredCount={events.length}
              hideViewToggle
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="mt-10"
          >
            {events.length === 0 && !loading && (!everHadEvents || filters.status || filters.type || filters.search) ? (
              <div className="flex flex-col items-center justify-center min-h-[420px] text-center rounded-2xl border border-border bg-card shadow-soft">
                <div className="size-20 rounded-2xl bg-gradient-to-br from-gold-soft/60 to-gold-soft/20 border border-gold/20 flex items-center justify-center mb-5 shadow-sm">
                  <Calendar className="size-8 text-gold" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                  {filters.status || filters.type || filters.search
                    ? 'Aucun résultat'
                    : 'Aucun événement'}
                </h3>
                <p className="text-sm text-muted-foreground/70 max-w-sm mb-8 leading-relaxed">
                  {filters.status || filters.type || filters.search
                    ? 'Aucun événement ne correspond aux filtres actuels. Essayez de modifier vos critères de recherche.'
                    : 'Commencez par créer votre premier événement pour le voir apparaître ici.'}
                </p>
                {(filters.status || filters.type || filters.search) ? (
                  <button
                    onClick={() => { setFilters({}); setSearchInput('') }}
                    className="h-10 px-5 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold/90 transition-colors shadow-sm"
                  >
                    Effacer les filtres
                  </button>
                ) : (
                  <button
                    onClick={() => { setCreateDefaults(undefined); setCreateOpen(true) }}
                    className="h-10 px-5 rounded-lg bg-gradient-charcoal text-white text-sm font-medium hover:opacity-95 transition-all shadow-lift inline-flex items-center gap-2"
                  >
                    <Calendar className="size-4" />
                    Créer un événement
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                <div className="hidden md:block">
                  <EventManager
                    events={calendarEvents}
                    onEventClick={handleCalendarEventClick}
                    onNewEvent={() => { setCreateDefaults(undefined); setCreateOpen(true) }}
                    onEventUpdate={handleEventUpdate}
                    categories={eventCategories}
                    colors={eventColors}
                    hideFilters
                  />
                </div>
                <div className="block md:hidden">
                  <MiniCalendar />
                </div>
              </div>
            )}
          </motion.div>

          <footer className="mt-16 mb-6 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              Tous les services opérationnels
            </div>
            <div>&copy; TUR &mdash; Suite traiteur premium</div>
          </footer>
        </div>

        <CreateEventDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={refresh}
          defaultValues={createDefaults}
        />

        {deleteTarget && (
          <DeleteEventDialog
            open={!!deleteTarget}
            onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
            event={deleteTarget}
            onSuccess={refresh}
          />
        )}

        <EventDetailSheet
          event={selectedEvent}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      </div>
    </PrivacyModeProvider>
  )
}
