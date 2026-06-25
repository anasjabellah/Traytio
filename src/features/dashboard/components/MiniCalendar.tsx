'use client';

import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useMiniCalendar } from '@/features/dashboard/hooks/use-mini-calendar';
import { mad } from '@/features/dashboard/constants';
import type { CalendarEventData } from '@/features/dashboard/actions/get-month-events';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const STATUS_DOT_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500',
  PLANNED: 'bg-blue-500',
  IN_PROGRESS: 'bg-orange-500',
  CANCELLED: 'bg-red-500',
  DRAFT: 'bg-gray-400',
  COMPLETED: 'bg-emerald-700',
};

const STATUS_POPOVER_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
  PLANNED: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-orange-50 text-orange-700',
  CANCELLED: 'bg-red-50 text-red-700',
  DRAFT: 'bg-gray-100 text-gray-700',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
};

const statusLabel = (s: string) =>
  s === 'CONFIRMED' ? 'Confirmé' : s === 'PLANNED' ? 'Planifié' : s === 'IN_PROGRESS' ? 'En cours' : s === 'CANCELLED' ? 'Annulé' : s === 'DRAFT' ? 'Brouillon' : s === 'COMPLETED' ? 'Terminé' : s;

const DOT_SIZE = 'size-1.5';

function DayPopover({ events, onEventClick }: {
  events: CalendarEventData[];
  onEventClick: (e: React.MouseEvent, id: string) => void;
}) {
  if (events.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3">
        Aucun &eacute;v&eacute;nement
      </p>
    );
  }

  return (
    <div className="space-y-1 max-h-52 overflow-y-auto">
      {events.map((ev) => (
        <div
          key={ev.id}
          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-foreground/[0.04] cursor-pointer transition-colors duration-150"
          onClick={(e) => onEventClick(e, ev.id)}
        >
          <span className={`mt-1 ${DOT_SIZE} rounded-full shrink-0 ${STATUS_DOT_COLORS[ev.status] || 'bg-gray-400'}`} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{ev.name}</div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
              {ev.clientName && <span className="truncate max-w-32">{ev.clientName}</span>}
              <span>{new Date(ev.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_POPOVER_COLORS[ev.status] || 'bg-gray-100 text-gray-700'}`}>
                {statusLabel(ev.status)}
              </span>
            </div>
            {ev.budget != null && (
              <div className="text-[11px] text-muted-foreground/70 mt-0.5 font-medium tabular-nums">
                {mad(ev.budget)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const DayCell = memo(function DayCell({
  day, isToday, isSelected, eventDots, onDayClick, onDayDoubleClick, onDayKeyDown,
}: {
  day: number;
  isToday: boolean;
  isSelected: boolean;
  eventDots: string[];
  onDayClick: (day: number) => void;
  onDayDoubleClick: (day: number) => void;
  onDayKeyDown: (day: number, e: React.KeyboardEvent) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${day}`}
      className={`relative aspect-square rounded-lg text-xs flex items-center justify-center cursor-pointer select-none outline-none transition-all duration-150
        ${isToday || isSelected
          ? 'bg-foreground text-background font-medium shadow-sm scale-[1.02]'
          : 'text-foreground hover:bg-foreground/[0.06] hover:ring-1 hover:ring-border/40 focus-visible:ring-2 focus-visible:ring-primary/40'
        }
      `}
      onClick={() => onDayClick(day)}
      onDoubleClick={() => onDayDoubleClick(day)}
      onKeyDown={(e) => onDayKeyDown(day, e)}
    >
      {day}
      {eventDots.length > 0 && (
        <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 flex gap-[2.5px]">
          {eventDots.slice(0, 3).map((color, j) => (
            <span key={j} className={`${DOT_SIZE} rounded-full ${color}`} />
          ))}
        </span>
      )}
    </div>
  );
});

export const MiniCalendar = memo(function MiniCalendar() {
  const router = useRouter();
  const { currentYear, currentMonth, events, prevMonth, nextMonth } = useMiniCalendar();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const monthKey = `${currentYear}-${currentMonth}`;
  const daysInMonth = useMemo(
    () => new Date(currentYear, currentMonth, 0).getDate(),
    [currentYear, currentMonth],
  );

  useEffect(() => {
    if (selectedDay !== null && selectedDay > daysInMonth) {
      setSelectedDay(null);
    }
  }, [selectedDay, daysInMonth]);

  const today = useMemo(() => new Date(), []);
  const todayDate = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const todayYear = today.getFullYear();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days: Array<number | null> = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentYear, currentMonth, daysInMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEventData[]>();
    for (const ev of events) {
      const day = new Date(ev.startDate).getDate();
      const existing = map.get(day);
      if (existing) {
        existing.push(ev);
      } else {
        map.set(day, [ev]);
      }
    }
    return map;
  }, [events]);

  const activeEvents = selectedDay !== null ? (eventsByDay.get(selectedDay) || []) : [];

  const isToday = useCallback(
    (day: number) => day === todayDate && currentMonth === todayMonth && currentYear === todayYear,
    [todayDate, todayMonth, todayYear, currentMonth, currentYear],
  );

  const handleDayClick = useCallback((day: number) => {
    setSelectedDay((prev) => (prev === day ? null : day));
  }, []);

  const handleEventClick = useCallback((e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    router.push(`/dashboard/events/${eventId}`);
  }, [router]);

  const handleDayDoubleClick = useCallback((day: number) => {
    const dayEvents = eventsByDay.get(day);
    if (dayEvents && dayEvents.length > 0) {
      router.push(`/dashboard/events/${dayEvents[0].id}`);
    }
  }, [eventsByDay, router]);

  const handleDayKeyDown = useCallback((day: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDayClick(day);
    }
  }, [handleDayClick]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Calendrier
          </div>
          <h3 className="font-display text-2xl mt-1">
            Aper&ccedil;u
          </h3>
        </div>

        <div className="flex items-center gap-0">
          <button
            onClick={prevMonth}
            className="flex items-center justify-center size-9 rounded-lg hover:bg-foreground/[0.06] active:bg-foreground/[0.1] active:scale-95 text-muted-foreground hover:text-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="size-4" />
          </button>

          <span className="w-28 text-center text-sm font-semibold tabular-nums select-none">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>

          <button
            onClick={nextMonth}
            className="flex items-center justify-center size-9 rounded-lg hover:bg-foreground/[0.06] active:bg-foreground/[0.1] active:scale-95 text-muted-foreground hover:text-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Mois suivant"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-[3px] text-xs font-medium text-muted-foreground text-center mb-2.5">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className="py-0.5">{d}</div>
        ))}
      </div>

      <motion.div
        key={monthKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="grid grid-cols-7 gap-[3px]"
      >
        {calendarDays.map((day, i) => {
          if (day === null) {
            return <div key={i} className="aspect-square" />;
          }

          const isTodayFlag = isToday(day);
          const isSelected = selectedDay === day;

          const dayEvents = eventsByDay.get(day);
          const eventDots = dayEvents
            ? dayEvents.slice(0, 3).map((ev) => STATUS_DOT_COLORS[ev.status] || 'bg-gray-400')
            : [];

          return (
            <DayCell
              key={i}
              day={day}
              isToday={isTodayFlag}
              isSelected={isSelected}
              eventDots={eventDots}
              onDayClick={handleDayClick}
              onDayDoubleClick={handleDayDoubleClick}
              onDayKeyDown={handleDayKeyDown}
            />
          );
        })}
      </motion.div>

      {selectedDay !== null && (
        <div className="mt-3 p-3 rounded-xl border border-border bg-card shadow-lift">
          <div className="text-[11px] font-medium text-muted-foreground mb-2">
            {selectedDay} {MONTH_NAMES[currentMonth - 1]} {currentYear}
            {activeEvents.length > 0 && (
              <span className="ml-1.5 text-muted-foreground/60">
                &bull; {activeEvents.length} &eacute;v&eacute;nement{activeEvents.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <DayPopover events={activeEvents} onEventClick={handleEventClick} />
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className={`${DOT_SIZE} rounded-full bg-emerald-500`} /> Confirm&eacute;
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`${DOT_SIZE} rounded-full bg-blue-500`} /> Planifi&eacute;
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`${DOT_SIZE} rounded-full bg-orange-500`} /> En cours
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`${DOT_SIZE} rounded-full bg-red-500`} /> Annul&eacute;
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`${DOT_SIZE} rounded-full bg-gray-400`} /> Brouillon
        </span>
      </div>
    </div>
  );
});
