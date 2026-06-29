'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Clock, Users, MapPin, ChevronRight } from 'lucide-react'
import type { Event } from '@/features/events/types'
import { TYPE_ACCENT } from '@/features/events/constants'

export const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500',
  PLANNED: 'bg-blue-500',
  IN_PROGRESS: 'bg-orange-500',
  CANCELLED: 'bg-red-500',
  DRAFT: 'bg-gray-400',
  COMPLETED: 'bg-emerald-600',
}

const STATUS_BG: Record<string, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PLANNED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-orange-50 text-orange-700 border-orange-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  DRAFT: 'bg-gray-50 text-gray-600 border-gray-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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

function getWeekDays(date: Date): Date[] {
  const monday = new Date(date)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function WeekAgendaView({
  events,
  currentDate,
  onEventClick,
  onEventRightClick,
  loading,
}: {
  events: Event[]
  currentDate: Date
  onEventClick: (event: Event) => void
  onEventRightClick?: (event: Event, e: React.MouseEvent) => void
  loading: boolean
}) {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const today = useMemo(() => new Date(), [])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>()
    for (const day of weekDays) {
      const key = day.toDateString()
      const dayEvents = events
        .filter((e) => {
          const d = new Date(e.startDate)
          return isSameDay(d, day)
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      map.set(key, dayEvents)
    }
    return map
  }, [events, weekDays])

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <div className="size-4 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          Chargement...
        </div>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border/5">
      {weekDays.map((day, idx) => {
        const key = day.toDateString()
        const dayEvents = eventsByDay.get(key) || []
        const isToday = isSameDay(day, today)
        const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate()) && !isToday
        const dayStr = day.toLocaleDateString('fr-FR', { month: 'long' })

        return (
          <div
            key={key}
            className={`${isToday ? 'bg-amber-50/30' : ''} ${isPast ? 'opacity-50' : ''} transition-all`}
          >
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md px-6 py-3 flex items-center gap-3 border-b border-border/5">
              <span
                className={`inline-flex items-center justify-center size-9 rounded-xl font-display text-sm font-semibold tabular-nums ${isToday ? 'bg-amber-400 text-white shadow-sm' : 'text-foreground bg-foreground/[0.04]'}`}
              >
                {day.getDate()}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-foreground">{DAY_LABELS[idx]}</span>
                <span className="text-xs text-muted-foreground/50">{dayStr}</span>
              </div>
              {dayEvents.length > 0 && (
                <span className="ml-auto text-[11px] text-muted-foreground/40 font-medium tabular-nums">
                  {dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="px-5 py-3 space-y-2.5">
              {dayEvents.length === 0 ? (
                <div className="px-4 py-5 text-center">
                  <p className="text-xs text-muted-foreground/30 font-medium">Aucun événement</p>
                </div>
              ) : (
                dayEvents.map((event, eIdx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: eIdx * 0.04 }}
                    className="group relative rounded-xl border border-border/40 bg-card shadow-sm hover:shadow-md hover:border-border/60 transition-all cursor-pointer"
                    onClick={() => onEventClick(event)}
                    onContextMenu={(e) => onEventRightClick?.(event, e)}
                  >
                    <div className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full ${STATUS_COLORS[event.status] || 'bg-gray-400'}`} />

                    <div className="pl-5 pr-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2.5 text-xs text-muted-foreground/60">
                            <div className="flex items-center gap-1.5 font-medium tabular-nums">
                              <Clock className="size-3" strokeWidth={1.5} />
                              <span>{fmtTime(event.startDate)}</span>
                            </div>
                            {event.clientName && (
                              <>
                                <span className="text-muted-foreground/20">·</span>
                                <span className="font-medium text-muted-foreground/70 truncate max-w-[180px]">{event.clientName}</span>
                              </>
                            )}
                          </div>

                          <h4 className="text-sm font-semibold text-foreground leading-snug">{event.name}</h4>

                          <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${STATUS_BG[event.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              <span className={`size-1.5 rounded-full ${STATUS_COLORS[event.status] || 'bg-gray-400'}`} />
                              {STATUS_LABELS[event.status] || event.status}
                            </span>
                            <span className={`size-2 rounded-full ${TYPE_ACCENT[event.type] || TYPE_ACCENT.OTHER}`} />
                            {event.guestCount != null && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50 font-medium">
                                <Users className="size-3" strokeWidth={1.5} />
                                <span>{event.guestCount} invités</span>
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50 font-medium truncate max-w-[200px]">
                                <MapPin className="size-3 shrink-0" strokeWidth={1.5} />
                                <span className="truncate">{event.location}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="size-4 text-muted-foreground/15 group-hover:text-muted-foreground/35 transition-colors shrink-0 mt-1.5" strokeWidth={1.5} />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
