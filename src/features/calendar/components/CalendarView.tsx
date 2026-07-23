'use client'

import { useMemo, useCallback, useRef, useState, useEffect, memo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, Wallet, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import type { DatesSetArg, EventDropArg, DateSelectArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import type { Event } from '@/features/events/types'
import { TYPE_BAR, TYPE_BAR_HOVER, TYPE_ACCENT } from '@/features/events/constants'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { WeekAgendaView } from './WeekAgendaView'

const VIEWS = [
  { key: 'dayGridMonth', label: 'Mois' },
  { key: 'timeGridWeek', label: 'Semaine' },
  { key: 'timeGridDay', label: 'Jour' },
] as const

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500',
  PLANNED: 'bg-blue-500',
  IN_PROGRESS: 'bg-orange-500',
  CANCELLED: 'bg-red-500',
  DRAFT: 'bg-gray-400',
  COMPLETED: 'bg-emerald-600',
}

const STATUS_COLORS_BG: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500/10',
  PLANNED: 'bg-blue-500/10',
  IN_PROGRESS: 'bg-orange-500/10',
  CANCELLED: 'bg-red-500/10',
  DRAFT: 'bg-gray-400/10',
  COMPLETED: 'bg-emerald-600/10',
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmé', PLANNED: 'Planifié', IN_PROGRESS: 'En cours',
  CANCELLED: 'Annulé', DRAFT: 'Brouillon', COMPLETED: 'Terminé',
}

function fmtTime(d: string | Date) {
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export const CalendarView = memo(function CalendarView({
  events,
  onDatesSet,
  onEventClick,
  onDateSelect,
  onEventRightClick,
  loading,
  thisMonthCount: externalMonthCount,
  onEventDrop,
  onEventResize,
}: {
  events: Event[]
  onDatesSet: (arg: DatesSetArg) => void
  onEventClick: (event: Event) => void
  onDateSelect?: (arg: DateSelectArg) => void
  onEventRightClick?: (event: Event, e: React.MouseEvent) => void
  loading: boolean
  thisMonthCount?: number
  onEventDrop?: (arg: EventDropArg) => void
  onEventResize?: (arg: EventResizeDoneArg) => void
}) {
  const calendarRef = useRef<FullCalendar>(null)
  const today = useMemo(() => new Date(), [])
  const [viewInfo, setViewInfo] = useState({ title: '', month: today.getMonth(), year: today.getFullYear(), viewType: 'dayGridMonth' })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [weekDate, setWeekDate] = useState<Date | null>(null)
  const lastDatesSetKey = useRef('')

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const key = `${arg.startStr}|${arg.endStr}|${arg.view.type}`
      if (key === lastDatesSetKey.current) return
      lastDatesSetKey.current = key

      if (calendarRef.current) {
        const d = calendarRef.current.getApi().getDate()
        if (d) {
          const month = d.getMonth()
          const year = d.getFullYear()
          const viewType = arg.view.type
          setViewInfo((prev) =>
            prev.month === month && prev.year === year && prev.viewType === viewType && prev.title === arg.view.title
              ? prev
              : { title: arg.view.title, month, year, viewType },
          )
        }
      }
      onDatesSet(arg)
    },
    [onDatesSet],
  )

  const thisMonthCount = externalMonthCount ?? useMemo(
    () => events.filter((e) => {
      const d = new Date(e.startDate)
      return d.getMonth() === viewInfo.month && d.getFullYear() === viewInfo.year
    }).length,
    [events, viewInfo.month, viewInfo.year],
  )

  const handlePrev = useCallback(() => {
    calendarRef.current?.getApi().prev()
  }, [])

  const handleNext = useCallback(() => {
    calendarRef.current?.getApi().next()
  }, [])

  const handleToday = useCallback(() => {
    calendarRef.current?.getApi().today()
  }, [])

  const handleViewChange = useCallback((view: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const api = calendarRef.current?.getApi()
    if (api) api.changeView(view)
  }, [])

  const eventById = useMemo(() => {
    const map = new Map<string, Event>()
    for (const e of events) map.set(e.id, e)
    return map
  }, [events])

  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    d.setHours(0, 0, 0, 0)
    return d
  }

  function formatWeekTitle(monday: Date): string {
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    const fmtMonth = (d: Date) => d.toLocaleDateString('fr-FR', { month: 'long' })
    const fmtDay = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric' })
    const year = monday.getFullYear()
    if (monday.getMonth() === sunday.getMonth()) {
      return `${fmtDay(monday)} - ${fmtDay(sunday)} ${fmtMonth(monday)} ${year}`
    }
    return `${fmtDay(monday)} ${fmtMonth(monday)} - ${fmtDay(sunday)} ${fmtMonth(sunday)} ${year}`
  }

  const eventsCountByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of events) {
      const d = e.startDate instanceof Date ? e.startDate : new Date(e.startDate)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      map.set(key, (map.get(key) || 0) + 1)
    }
    return map
  }, [events])

  function EventTooltip({ event, children }: { event: Event; children: React.ReactNode }) {
    const statusLabels: Record<string, string> = {
      CONFIRMED: 'Confirmé', PLANNED: 'Planifié', IN_PROGRESS: 'En cours',
      CANCELLED: 'Annulé', DRAFT: 'Brouillon', COMPLETED: 'Terminé',
    }
    return (
      <Tooltip>
        <TooltipTrigger>{children}</TooltipTrigger>
        <TooltipContent side="top" align="center" sideOffset={6} className="w-56 p-3 rounded-xl border border-border/60 bg-card shadow-xl">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">{event.name}</p>
            <div className="h-px bg-border/30" />
            <div className="space-y-1.5 text-xs text-muted-foreground/80">
              {event.clientName && <div className="flex items-center gap-2"><CalendarIcon className="size-3 text-muted-foreground/40" strokeWidth={1.5} /><span>{event.clientName}</span></div>}
              <div className="flex items-center gap-2"><Clock className="size-3 text-muted-foreground/40" strokeWidth={1.5} /><span>{fmtTime(event.startDate)}</span></div>
              <div className="flex items-center gap-2"><span className={`inline-block size-1.5 rounded-full ${STATUS_COLORS[event.status] || 'bg-gray-400'}`} /><span>{statusLabels[event.status] || event.status}</span></div>
              {event.budget != null && <div className="flex items-center gap-2"><Wallet className="size-3 text-muted-foreground/40" strokeWidth={1.5} /><span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(event.budget)}</span></div>}
              {event.guestCount != null && <div className="flex items-center gap-2"><Users className="size-3 text-muted-foreground/40" strokeWidth={1.5} /><span>{event.guestCount} invités</span></div>}
              {event.location && <div className="flex items-center gap-2"><MapPin className="size-3 text-muted-foreground/40" strokeWidth={1.5} /><span className="truncate">{event.location}</span></div>}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  const renderEventContent = useCallback(
    (arg: { event: { id: string; start?: Date | null }; timeText: string }) => {
      const event = eventById.get(arg.event.id)
      if (!event) return <div />
      const time = fmtTime(event.startDate)
      const isHovered = hoveredId === event.id
      return (
        <EventTooltip event={event}>
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`${STATUS_COLORS_BG[event.status] || ''} ${TYPE_BAR[event.type] || TYPE_BAR.OTHER} ${TYPE_BAR_HOVER[event.type] || TYPE_BAR_HOVER.OTHER} rounded-lg px-3 py-[10px] border w-[calc(100%-8px)] cursor-pointer transition-all ${isHovered ? 'shadow-md ring-1 ring-inset ring-black/5 -translate-y-[1px]' : 'shadow-sm'}`}
            onMouseEnter={() => setHoveredId(event.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`size-2.5 rounded-full shrink-0 ${TYPE_ACCENT[event.type] || TYPE_ACCENT.OTHER}`} />
              <span className="text-[13px] font-medium text-gray-900 leading-tight truncate">{event.clientName || event.name}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5 ml-[18px]">
              <span className="text-[12px] text-gray-500/70 tabular-nums">{time}</span>
            </div>
          </motion.div>
        </EventTooltip>
      )
    },
    [eventById, hoveredId],
  )

  const renderDayCellContent = useCallback(
    (arg: { date: Date; isToday: boolean; dayNumberText: string }) => {
      const key = `${arg.date.getFullYear()}-${arg.date.getMonth()}-${arg.date.getDate()}`
      const count = eventsCountByDate.get(key) || 0
      return (
        <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1.5 w-full">
          <span className={`text-xs font-semibold w-7 h-7 flex items-center justify-center ${arg.isToday ? 'bg-amber-400 text-white shadow-sm rounded-lg' : 'text-gray-700 rounded-lg'}`}>
            {arg.dayNumberText}
          </span>
          {count > 0 && !arg.isToday && (
            <span className="text-[10px] text-gray-400 font-semibold">{count}</span>
          )}
        </div>
      )
    },
    [eventsCountByDate],
  )

  const dayCellClassNames = useCallback(
    (arg: { date: Date; isToday: boolean; isOther: boolean; isPast: boolean }) => {
      const dow = arg.date.getDay()
      const isWeekend = dow === 0 || dow === 6
      if (arg.isOther) return ['!border-dashed', '!border-border/15', '!bg-transparent']
      if (arg.isToday) return ['!border-amber-300', '!bg-amber-50/50', 'shadow-sm', '!ring-2', '!ring-amber-400/30', 'z-10', '!border-2']
      if (isWeekend) return ['!border-border/15', '!bg-muted/[0.07]']
      if (arg.isPast) return ['!border-border/15', '!bg-background']
      return ['!border-border/20', '!bg-background', 'hover:!border-primary/30', 'hover:!shadow-md', 'hover:z-10', 'hover:scale-[1.005]', 'cursor-pointer']
    },
    [],
  )

  const overrides = useMemo(() => ({
    '.fc': {
      fontFamily: 'inherit',
    },
    '.fc .fc-daygrid-day': {
      borderRadius: '0.75rem',
      border: '1px solid',
      minHeight: '150px',
      transition: 'all 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
      backgroundColor: 'var(--card)',
    },
    '.fc .fc-daygrid-day.fc-day-other': {
      borderStyle: 'dashed',
      background: 'transparent',
    },
    '.fc .fc-daygrid-day:hover': {
      borderColor: 'rgba(var(--primary), 0.30)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      transform: 'scale(1.002)',
    },
    '.fc .fc-daygrid-day-frame': {
      padding: '0',
      minHeight: '150px',
    },
    '.fc .fc-daygrid-day-top': {
      flexDirection: 'row' as const,
      justifyContent: 'flex-start',
      padding: '0',
      marginBottom: '0',
    },
    '.fc .fc-daygrid-day-number': {
      padding: '0',
      fontSize: '0',
      fontWeight: 'inherit',
      color: 'inherit',
      textDecoration: 'none',
    },
    '.fc .fc-daygrid-day-events': {
      minHeight: '0',
      padding: '2px 4px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    '.fc .fc-daygrid-more-link': {
      fontSize: '10px',
      color: '#9CA3AF',
      fontWeight: 600,
      textAlign: 'center',
      paddingTop: '4px',
      display: 'block',
      cursor: 'pointer',
    },
    '.fc .fc-daygrid-more-link:hover': {
      color: '#6B7280',
      textDecoration: 'underline',
    },
    '.fc .fc-daygrid-event': {
      marginTop: '0',
      marginBottom: '0',
      borderRadius: '0.5rem',
      border: 'none',
      whiteSpace: 'normal' as const,
    },
    '.fc .fc-event': {
      border: 'none',
      background: 'transparent',
    },
    '.fc .fc-event-main': {
      padding: '0',
      overflow: 'visible',
    },
    '.fc .fc-daygrid-body-unbalanced .fc-daygrid-day-events': {
      position: 'relative',
      minHeight: '0',
    },
    '.fc-theme-standard .fc-daygrid-day': {
      border: '1px solid',
    },
    '.fc-theme-standard td': {
      border: 'none',
    },
    '.fc-scrollgrid-sync-table td': {
      border: 'none',
    },
    '.fc .fc-scrollgrid': {
      border: 'none',
      borderCollapse: 'separate' as const,
      borderSpacing: '0 8px',
    },
    '.fc .fc-col-header': {
      border: 'none',
      marginBottom: '2px',
    },
    '.fc .fc-col-header-cell': {
      border: 'none',
      padding: '8px 0 4px',
    },
    '.fc .fc-col-header-cell-cushion': {
      padding: '0',
      fontSize: '11px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.14em',
      fontWeight: 600,
      color: '#6B7280',
    },
    '.fc .fc-day-sat .fc-col-header-cell-cushion, .fc .fc-day-sun .fc-col-header-cell-cushion': {
      color: '#6B7280',
      opacity: 0.6,
    },
    '.fc .fc-daygrid-day-bottom': {
      fontSize: '10px',
      color: '#9CA3AF',
      fontWeight: 600,
      textAlign: 'center',
      paddingTop: '4px',
      paddingBottom: '2px',
    },
    '.fc .fc-non-business': {
      background: 'transparent',
    },
    '.fc .fc-scrollgrid-liquid': {
      height: 'auto',
    },
    '.fc .fc-day-other .fc-daygrid-day-top .fc-daygrid-day-number': {
      opacity: 0.35,
    },
    '.fc .fc-highlight': {
      background: 'rgba(201, 163, 91, 0.1)',
      borderRadius: '0.75rem',
    },
    '.fc .fc-daygrid-day.fc-day-today': {
      position: 'relative',
      zIndex: 1,
    },
    '.fc .fc-event-dragging': {
      opacity: '0.6 !important',
      transform: 'scale(0.95)',
    },
    '.fc .fc-event-resizing': {
      opacity: '0.7',
    },
    '.fc .fc-daygrid-day-events > *': {
      width: '100%',
    },
  }), [])

  const fcEvents = useMemo(
    () => events.map((event) => ({
      id: event.id,
      title: event.name,
      start: event.startDate instanceof Date ? event.startDate.toISOString() : event.startDate,
      end: event.endDate instanceof Date ? event.endDate.toISOString() : undefined,
      allDay: false,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: 'inherit',
      classNames: ['fc-event-custom'],
    })),
    [events],
  )

  // Keyboard shortcuts for calendar navigation
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable
      if (isInput) return
      switch (e.key) {
        case 'ArrowLeft':
          if (e.altKey) { e.preventDefault(); calendarRef.current?.getApi().prev() }
          break
        case 'ArrowRight':
          if (e.altKey) { e.preventDefault(); calendarRef.current?.getApi().next() }
          break
        case 'T':
        case 't':
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); calendarRef.current?.getApi().today() }
          break
        case '?':
          e.preventDefault(); setShortcutsHelpOpen((s) => !s)
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative">
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {/* Custom header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="font-display text-xl capitalize text-foreground">{viewInfo.title}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {thisMonthCount === 0 && events.length > 0
                ? 'Aucun événement ce mois'
                : `${thisMonthCount} événement${thisMonthCount > 1 ? 's' : ''} ce mois`
              }
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleToday}
              aria-label="Aller à aujourd'hui"
              className="h-10 px-4 rounded-lg border border-border bg-background/60 backdrop-blur text-xs font-medium text-gray-700 hover:text-foreground hover:bg-muted/30 hover:border-border transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:ring-offset-1"
            >
              Aujourd&apos;hui
            </button>
            <div className="flex items-center" role="group" aria-label="Navigation mois">
              <button
                onClick={handlePrev}
                aria-label="Mois précédent"
                className="size-10 rounded-l-lg border border-border bg-background/60 backdrop-blur hover:bg-muted/30 hover:border-border transition-all flex items-center justify-center text-gray-600 hover:text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:ring-offset-1 focus:z-10"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
              </button>
              <button
                onClick={handleNext}
                aria-label="Mois suivant"
                className="size-10 rounded-r-lg border-t border-b border-r border-border bg-background/60 backdrop-blur hover:bg-muted/30 hover:border-border transition-all flex items-center justify-center text-gray-600 hover:text-foreground -ml-px shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:ring-offset-1"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
            <div className="ml-2 flex p-0.5 rounded-lg bg-foreground/[0.04] border border-border" role="group" aria-label="Changement de vue">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  onClick={(e) => handleViewChange(v.key, e)}
                  aria-label={`Vue ${v.label}`}
                  aria-pressed={viewInfo.viewType === v.key}
                  className={`h-7 px-3 rounded-[7px] text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gold/40 focus:ring-offset-1 ${
                    viewInfo.viewType === v.key
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status legend */}
        <div className="flex items-center gap-5 px-5 pb-3 flex-wrap" role="list" aria-label="Légende des statuts">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <span key={status} className="flex items-center gap-2 text-xs font-medium text-gray-500" role="listitem">
              <span className={`inline-block size-2.5 rounded-full ${color}`} aria-hidden="true" />
              {STATUS_LABELS[status]}
            </span>
          ))}
        </div>

        <div className="border-t border-border/10">
          <style>{Object.entries(overrides).map(([selector, rules]) => `${selector} { ${Object.entries(rules).map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${typeof v === 'string' ? v : ''}`).join('; ')} }`).join('\n')}</style>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={frLocale}
            firstDay={1}
            headerToolbar={false}
            events={fcEvents}
            datesSet={handleDatesSet}
            eventClick={(info) => {
              const event = eventById.get(info.event.id)
              if (event) onEventClick(event)
            }}
            eventContent={renderEventContent}
            dayCellContent={renderDayCellContent}
            dayCellClassNames={dayCellClassNames}
            height="auto"
            contentHeight="auto"
            stickyHeaderDates={false}
            weekNumbers={false}
            weekends={true}
            dayMaxEvents={4}
            moreLinkText={(num) => `+${num}`}
            expandRows={false}
            nowIndicator={true}
            selectable={true}
            select={onDateSelect}
            selectMinDistance={3}
            editable={true}
            droppable={false}
            eventDurationEditable={true}
            eventDragMinDistance={5}
            eventDrop={onEventDrop}
            eventResize={onEventResize}
            eventDidMount={(info) => {
              info.el.addEventListener('contextmenu', (e: MouseEvent) => {
                e.preventDefault()
                const ev = eventById.get(info.event.id)
                if (ev && onEventRightClick) onEventRightClick(ev, e as unknown as React.MouseEvent)
              })
            }}
            dayHeaders={true}
            dayHeaderFormat={{ weekday: 'short' } as Intl.DateTimeFormatOptions}
            fixedWeekCount={false}
            showNonCurrentDates={true}
          />
        </div>
      </div>

      {/* Shortcuts help modal */}
      {shortcutsHelpOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShortcutsHelpOpen(false)}>
          <div className="w-80 rounded-2xl border border-border/60 bg-card shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-display text-sm font-semibold text-foreground mb-3">Raccourcis clavier</h4>
            <div className="space-y-1.5 text-xs text-muted-foreground/80">
              <div className="flex items-center justify-between"><kbd className="px-2 py-0.5 rounded bg-muted/40 text-[11px] font-mono font-medium text-foreground/70">N</kbd><span>Nouvel événement</span></div>
              <div className="flex items-center justify-between"><kbd className="px-2 py-0.5 rounded bg-muted/40 text-[11px] font-mono font-medium text-foreground/70">T</kbd><span>Aujourd&apos;hui</span></div>
              <div className="flex items-center justify-between"><kbd className="px-2 py-0.5 rounded bg-muted/40 text-[11px] font-mono font-medium text-foreground/70">Alt + ←</kbd><span>Mois précédent</span></div>
              <div className="flex items-center justify-between"><kbd className="px-2 py-0.5 rounded bg-muted/40 text-[11px] font-mono font-medium text-foreground/70">Alt + →</kbd><span>Mois suivant</span></div>
              <div className="flex items-center justify-between"><kbd className="px-2 py-0.5 rounded bg-muted/40 text-[11px] font-mono font-medium text-foreground/70">Esc</kbd><span>Fermer les panneaux</span></div>
              <div className="flex items-center justify-between"><kbd className="px-2 py-0.5 rounded bg-muted/40 text-[11px] font-mono font-medium text-foreground/70">?</kbd><span>Ce menu</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
