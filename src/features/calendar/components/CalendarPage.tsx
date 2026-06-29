'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, CalendarCheck, CalendarRange, Wallet, Banknote, ExternalLink, Pencil, Copy, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import type { DatesSetArg, EventDropArg, DateSelectArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import { PrivacyModeProvider } from '@/components/privacy-mode'
import { useCalendarData } from '@/features/calendar/hooks/use-calendar-data'
import { CalendarView } from '@/features/calendar/components/CalendarView'
import { EventDetailSheet } from '@/features/calendar/components/EventDetailSheet'
import { EventsHeader } from '@/features/events/components/EventsHeader'
import { EventsStats } from '@/features/events/components/EventsStats'
import { EventsFilters } from '@/features/events/components/EventsFilters'
import { CreateEventDialog } from '@/features/events/components/create-event-dialog'
import { DeleteEventDialog } from '@/features/events/components/delete-event-dialog'
import { updateEvent } from '@/features/events/actions/update-event'
import { duplicateEvent } from '@/features/events/actions/duplicate-event'
import type { Event } from '@/features/events/types'

export function CalendarPage() {
  const router = useRouter()
  const {
    events, allEvents, loading, error, stats, filters, setFilters, setDateRange, refresh, everHadEvents,
  } = useCalendarData()

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createDefaults, setCreateDefaults] = useState<Record<string, unknown> | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; event: Event } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // Close context menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    if (contextMenu) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [contextMenu])

  // Keyboard shortcuts
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
          setContextMenu(null)
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

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      setDateRange({ from: arg.startStr, to: arg.endStr })
    },
    [setDateRange],
  )

  const handleEventClick = useCallback((event: Event) => {
    setSelectedEvent(event)
    setSheetOpen(true)
  }, [])

  const handleDateSelect = useCallback((arg: DateSelectArg) => {
    const startDate = new Date(arg.startStr)
    const endDate = new Date(arg.startStr)
    endDate.setHours(endDate.getHours() + 2)
    setCreateDefaults({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    } as unknown as Record<string, unknown>)
    setCreateOpen(true)
  }, [])

  const handleRightClick = useCallback((event: Event, e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, event })
  }, [])

  const handleEventDrop = useCallback(async (arg: EventDropArg) => {
    const eventId = arg.event.id
    const newStart = arg.event.start
    const newEnd = arg.event.end
    if (!newStart) return
    const result = await updateEvent({
      id: eventId,
      startDate: newStart.toISOString(),
      endDate: newEnd ? newEnd.toISOString() : undefined,
    } as unknown as Record<string, unknown>)
    if (result.success) {
      toast.success('Événement déplacé')
      refresh()
    } else {
      toast.error(result.error || 'Erreur lors du déplacement')
      arg.revert()
    }
  }, [refresh])

  const handleEventResize = useCallback(async (arg: EventResizeDoneArg) => {
    const eventId = arg.event.id
    const newEnd = arg.event.end
    const newStart = arg.event.start
    if (!newStart || !newEnd) return
    const result = await updateEvent({
      id: eventId,
      startDate: newStart.toISOString(),
      endDate: newEnd.toISOString(),
    } as unknown as Record<string, unknown>)
    if (result.success) {
      toast.success('Événement redimensionné')
      refresh()
    } else {
      toast.error(result.error || 'Erreur lors du redimensionnement')
      arg.revert()
    }
  }, [refresh])

  const handleEdit = useCallback((event: Event) => {
    setSheetOpen(false)
    router.push(`/dashboard/events/${event.id}`)
  }, [router])

  const handleDeleteRequest = useCallback((event: Event) => {
    setSheetOpen(false)
    setContextMenu(null)
    setTimeout(() => setDeleteTarget(event), 300)
  }, [])

  const handleDuplicate = useCallback(async (event: Event) => {
    setContextMenu(null)
    const result = await duplicateEvent(event.id)
    if (result.success) {
      toast.success('Événement dupliqué')
      refresh()
    } else {
      toast.error(result.error || 'Erreur lors de la duplication')
    }
  }, [refresh])

  const handleOpenEvent = useCallback((event: Event) => {
    setContextMenu(null)
    setSheetOpen(false)
    router.push(`/dashboard/events/${event.id}`)
  }, [router])

  const KPIS = useMemo(() => [
    { label: 'Événements', value: stats.totalEvents, delta: 0, trend: 'up' as const, spark: [3, 4, 5, 4, 6, 5, 7], icon: Calendar, sensitive: false },
    { label: 'Cette semaine', value: stats.thisWeek, delta: 0, trend: 'up' as const, spark: [3, 4, 5, 4, 6, 5, 7], icon: CalendarCheck, sensitive: false },
    { label: 'Ce mois', value: stats.thisMonth, delta: 0, trend: 'up' as const, spark: [12, 15, 18, 14, 20, 22, 25], icon: CalendarRange, sensitive: false },
    { label: 'Budget total', value: stats.totalBudget, prefix: 'MAD', delta: 0, trend: 'up' as const, spark: [12, 15, 18, 14, 20, 22, 25], icon: Wallet, sensitive: true },
    { label: 'Encaissé', value: stats.totalPaid, prefix: 'MAD', delta: 0, trend: 'up' as const, spark: [12, 15, 18, 14, 20, 22, 25], icon: Banknote, sensitive: true },
  ], [stats])

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
              onCalendar={() => router.push('/dashboard/events')}
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
              paymentFilter={null}
              onPaymentFilterChange={() => {}}
              dateFrom=""
              onDateFromChange={() => {}}
              dateTo=""
              onDateToChange={() => {}}
              budgetMin=""
              onBudgetMinChange={() => {}}
              budgetMax=""
              onBudgetMaxChange={() => {}}
              viewMode="calendar"
              onViewModeChange={(v) => { if (v === 'table') router.push('/dashboard/events') }}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((s) => !s)}
              onRefresh={refresh}
              onResetFilters={() => { setFilters({}); setSearchInput('') }}
              filteredCount={events.length}
              searchMaxWidth="max-w-[580px] lg:max-w-[620px]"
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
                <div className="size-20 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/60 flex items-center justify-center mb-5 shadow-sm">
                  <Calendar className="size-8 text-amber-400" strokeWidth={1.5} />
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
                {loading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/60 backdrop-blur-[1px] rounded-2xl">
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <div className="size-4 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                      Mise à jour...
                    </div>
                  </div>
                )}
                <CalendarView
                  events={events}
                  onDatesSet={handleDatesSet}
                  onEventClick={handleEventClick}
                  onDateSelect={handleDateSelect}
                  onEventRightClick={handleRightClick}
                  loading={loading}
                  thisMonthCount={stats.thisMonth}
                  onEventDrop={handleEventDrop}
                  onEventResize={handleEventResize}
                />
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

        {/* Context menu */}
        {contextMenu && (
          <div
            ref={menuRef}
            style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 9999 }}
            className="w-44 rounded-xl border border-border/60 bg-card shadow-xl py-1.5 overflow-hidden"
          >
            <button
              onClick={() => handleOpenEvent(contextMenu.event)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-muted/40 transition-colors"
            >
              <ExternalLink className="size-3.5 text-muted-foreground/60" strokeWidth={1.5} />
              Ouvrir
            </button>
            <button
              onClick={() => { setContextMenu(null); handleEdit(contextMenu.event) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-muted/40 transition-colors"
            >
              <Pencil className="size-3.5 text-muted-foreground/60" strokeWidth={1.5} />
              Modifier
            </button>
            <button
              onClick={() => handleDuplicate(contextMenu.event)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-muted/40 transition-colors"
            >
              <Copy className="size-3.5 text-muted-foreground/60" strokeWidth={1.5} />
              Dupliquer
            </button>
            <div className="h-px bg-border/30 my-1" />
            <button
              onClick={() => handleDeleteRequest(contextMenu.event)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
            >
              <Trash2 className="size-3.5" strokeWidth={1.5} />
              Supprimer
            </button>
          </div>
        )}
      </div>
    </PrivacyModeProvider>
  )
}
