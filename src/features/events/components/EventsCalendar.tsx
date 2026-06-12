'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon, Clock, Users, Wallet, MapPin, User, Phone,
  Eye, Pencil, MessageCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { TYPE_BAR, TYPE_BAR_HOVER, TYPE_ACCENT, TYPE_LABEL } from '@/features/events/constants';
import type { Event } from '@/features/events/types';

function sameDayF(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function hasValidEndDate(e: Event) {
  if (!e.endDate) return false;
  const d = new Date(e.endDate);
  if (isNaN(d.getTime())) return false;
  const s = new Date(e.startDate);
  if (isNaN(s.getTime())) return false;
  if (d.getFullYear() < 2020 || d.getFullYear() > 2100) return false;
  const startOfDay = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  if (d.getTime() < startOfDay.getTime()) return false;
  return true;
}

function EventHoverCard({ event, onView, onEdit, onMouseEnter, onMouseLeave }: {
  event: Event;
  onView: (e: Event) => void;
  onEdit: (e: Event) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const statusLabels: Record<string, string> = {
    CONFIRMED: 'Confirmé', PLANNED: 'Planifié', IN_PROGRESS: 'En cours',
    CANCELLED: 'Annulé', DRAFT: 'Brouillon', COMPLETED: 'Terminé',
  };
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmtTime = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const accent = TYPE_ACCENT[event.type] || TYPE_ACCENT.OTHER;
  const whatsappUrl = event.clientPhone
    ? `https://wa.me/${event.clientPhone.replace(/[^0-9]/g, '')}`
    : null;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 rounded-xl border border-border/60 bg-card shadow-xl py-0 overflow-hidden"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`h-1.5 w-full ${accent}`} />
      <div className="p-3.5 space-y-2.5">
        <div>
          <p className="text-sm font-semibold text-foreground">{event.name}</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">{TYPE_LABEL[event.type] || event.type}</p>
        </div>
        <div className="h-px bg-border/30" />
        <div className="space-y-1.5 text-xs text-muted-foreground/80">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
            <span>{fmt(new Date(event.startDate))}{hasValidEndDate(event) && !sameDayF(new Date(event.startDate), new Date(event.endDate!)) ? ` → ${fmt(new Date(event.endDate!))}` : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
            <span>{fmtTime(new Date(event.startDate))}{hasValidEndDate(event) ? ` → ${fmtTime(new Date(event.endDate!))}` : ''}</span>
          </div>
          {event.clientName && (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
              <span>{event.clientName}</span>
            </div>
          )}
          {event.guestCount != null && (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
              <span>{event.guestCount} invités</span>
            </div>
          )}
          {event.budget != null && (
            <div className="flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
              <span>{formatCurrency(event.budget)}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {(event.contactPerson || event.contactPhone) && (
            <>
              {event.contactPerson && (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{event.contactPerson}</span>
                </div>
              )}
              {event.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{event.contactPhone}</span>
                </div>
              )}
            </>
          )}
        </div>
        <div className="h-px bg-border/30" />
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
            event.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-200' :
            event.status === 'PLANNED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            event.status === 'IN_PROGRESS' ? 'bg-orange-50 text-orange-700 border-orange-200' :
            event.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' :
            event.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            'bg-gray-100 text-gray-700 border-gray-200'
          }`}>{statusLabels[event.status] || event.status}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={(e) => { e.stopPropagation(); onView(event); }} className="size-6 rounded-md hover:bg-muted/40 flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors">
              <Eye className="h-3 w-3" strokeWidth={1.8} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onEdit(event); }} className="size-6 rounded-md hover:bg-muted/40 flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors">
              <Pencil className="h-3 w-3" strokeWidth={1.8} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); if (whatsappUrl) window.open(whatsappUrl, '_blank'); }} disabled={!whatsappUrl} className="size-6 rounded-md hover:bg-muted/40 flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <MessageCircle className="h-3 w-3" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventsCalendar({ events, isLoading, onView, onEdit }: {
  events: Event[];
  isLoading: boolean;
  onView: (e: Event) => void;
  onEdit: (e: Event) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth());
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleHoverStart = (e: Event) => {
    clearTimeout(closeTimer.current);
    openTimer.current = setTimeout(() => setHoveredEvent(e), 150);
  };
  const handleHoverEnd = () => {
    clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setHoveredEvent(null), 300);
  };
  const handleTooltipEnter = () => clearTimeout(closeTimer.current);
  const handleTooltipLeave = () => {
    closeTimer.current = setTimeout(() => setHoveredEvent(null), 300);
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const totalMonthEvents = useMemo(
    () => events.filter((e) => {
      const d = new Date(e.startDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length,
    [events, currentMonth, currentYear],
  );

  const monthEvents = useMemo(
    () => events.filter((e) => {
      const d = new Date(e.startDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }),
    [events, currentMonth, currentYear],
  );

  const eventsByDay = useMemo(() => {
    const map: Record<number, Event[]> = {};
    for (const e of monthEvents) {
      const d = new Date(e.startDate);
      const day = d.getDate();
      if (!map[day]) map[day] = [];
      map[day].push(e);
    }
    return map;
  }, [monthEvents]);

  const multiDayEvents = useMemo(() => {
    return monthEvents.filter(e => hasValidEndDate(e) && !sameDayF(new Date(e.startDate), new Date(e.endDate!)));
  }, [monthEvents]);

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const goTo = (m: number, y: number) => { setCurrentMonth(m); setCurrentYear(y); };
  const goToday = () => goTo(today.getMonth(), today.getFullYear());

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="p-5 animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-foreground/[0.05] rounded w-40" />
            <div className="h-5 bg-foreground/[0.05] rounded w-32" />
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-foreground/[0.02]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const weeks: number[][] = [];
  const totalCells = startOffset + daysInMonth;
  const rows = Math.ceil(totalCells / 7);
  for (let r = 0; r < rows; r++) {
    const week: number[] = [];
    for (let c = 0; c < 7; c++) {
      const idx = r * 7 + c - startOffset + 1;
      week.push(idx >= 1 && idx <= daysInMonth ? idx : 0);
    }
    weeks.push(week);
  }

  function getPlacements(weekDays: number[]) {
    if (weekDays.every(d => d === 0)) return [];
    const placements: Array<{ event: Event; colStart: number; colSpan: number; isLeftOpen: boolean; isRightOpen: boolean }> = [];
    const firstDayNum = weekDays.find(d => d > 0)!;
    const lastDayNum = weekDays.filter(d => d > 0).pop()!;
    const weekStart = new Date(currentYear, currentMonth, firstDayNum);
    const weekEnd = new Date(currentYear, currentMonth, lastDayNum);
    const weekEndEndOfDay = new Date(weekEnd);
    weekEndEndOfDay.setHours(23, 59, 59, 999);
    for (const event of multiDayEvents) {
      const s = new Date(event.startDate);
      const e = new Date(event.endDate!);
      if (e < weekStart || s > weekEndEndOfDay) continue;
      const leftBound = s > weekStart ? s : weekStart;
      const rightBound = e < weekEndEndOfDay ? e : weekEndEndOfDay;
      let colStart = weekDays.indexOf(leftBound.getDate());
      if (colStart === -1) colStart = 0;
      let colEnd = weekDays.indexOf(rightBound.getDate());
      if (colEnd === -1) colEnd = Math.min(weekDays.filter(d => d > 0).length - 1, 6);
      const isLeftOpen = !sameDayF(s, leftBound);
      const isRightOpen = !sameDayF(e, rightBound);
      const span = colEnd - colStart + 1;
      if (span >= 2 && span < 7) {
        placements.push({ event, colStart: colStart + 1, colSpan: span, isLeftOpen, isRightOpen });
      }
    }
    return placements;
  }

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card shadow-soft overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h3 className="font-display text-xl capitalize text-foreground">{monthLabel}</h3>
          <p className="text-[11px] text-gray-600 mt-0.5">{totalMonthEvents} événement{totalMonthEvents > 1 ? 's' : ''} ce mois</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="h-8 px-3.5 rounded-lg border border-border/60 text-xs font-medium text-gray-700 hover:text-foreground hover:bg-muted/30 hover:border-border transition-all"
          >
            Aujourd&apos;hui
          </button>
          <div className="flex items-center">
            <button onClick={() => { const d = new Date(currentYear, currentMonth - 1, 1); goTo(d.getMonth(), d.getFullYear()); }} className="size-8 rounded-l-lg border border-border/60 hover:bg-muted/30 hover:border-border transition-all flex items-center justify-center text-gray-700">
              <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <button onClick={() => { const d = new Date(currentYear, currentMonth + 1, 1); goTo(d.getMonth(), d.getFullYear()); }} className="size-8 rounded-r-lg border-t border-b border-r border-border/60 hover:bg-muted/30 hover:border-border transition-all flex items-center justify-center text-gray-700 -ml-px">
              <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border-t border-border/10">
        {/* Day headers */}
        <div className="grid grid-cols-7 px-2 pt-2.5 pb-1">
          {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map((d, i) => (
            <div key={d} className={`text-[10px] uppercase tracking-[0.14em] font-medium text-center ${i >= 5 ? 'text-gray-700/60' : 'text-gray-700'}`}>{d}</div>
          ))}
        </div>

        {/* Week rows */}
        <div className="px-2 pb-2 space-y-2">
          {weeks.map((week, wi) => {
            const placements = getPlacements(week);
            return (
              <div key={wi} className="relative grid grid-cols-7 gap-1.5">
                {placements.map((p, pi) => {
                  const time = fmtTime(new Date(p.event.startDate));
                  return (
                    <div
                      key={`m-${p.event.id}-${pi}`}
                      style={{ gridColumn: `${p.colStart} / span ${p.colSpan}` }}
                      className={`relative ${TYPE_BAR[p.event.type] || TYPE_BAR.OTHER} ${TYPE_BAR_HOVER[p.event.type] || TYPE_BAR_HOVER.OTHER} rounded-md text-[11px] font-medium px-2.5 py-1.5 border cursor-pointer transition-all flex items-center gap-2 z-10 shadow-sm ${p.isLeftOpen ? 'rounded-l-none ml-px' : ''} ${p.isRightOpen ? 'rounded-r-none mr-px' : ''}`}
                      onMouseEnter={() => handleHoverStart(p.event)}
                      onMouseLeave={handleHoverEnd}
                      onClick={() => onView(p.event)}
                    >
                      {!p.isLeftOpen && <span className={`size-1.5 rounded-full shrink-0 ${TYPE_ACCENT[p.event.type] || TYPE_ACCENT.OTHER}`} />}
                      <span className="truncate">{!p.isLeftOpen ? `${time} • ${p.event.name}` : p.event.name}</span>
                      {hoveredEvent?.id === p.event.id && (
                        <EventHoverCard event={p.event} onView={onView} onEdit={onEdit} onMouseEnter={handleTooltipEnter} onMouseLeave={handleTooltipLeave} />
                      )}
                    </div>
                  );
                })}
                {week.map((day, ci) => {
                  const isWeekend = ci >= 5;
                  const isEmpty = day === 0;
                  const td = isToday(day);
                  const dayEvents = !isEmpty ? (eventsByDay[day] || []) : [];
                  return (
                    <div
                      key={isEmpty ? `e-${wi}-${ci}` : day}
                      className={`relative rounded-xl border min-h-[130px] transition-all ${
                        isEmpty
                          ? 'border-dashed border-border/15 bg-transparent'
                          : td
                            ? 'border-amber-300 bg-amber-50/40 shadow-sm ring-1 ring-amber-300/30'
                            : isWeekend
                              ? 'border-border/20 bg-muted/15'
                              : 'border-border/20 bg-background hover:border-primary/20 hover:shadow-sm'
                      }`}
                    >
                      {!isEmpty && (
                        <>
                          <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
                            <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-md ${
                              td ? 'bg-amber-400 text-white' : 'text-gray-700'
                            }`}>
                              {day}
                            </div>
                            {dayEvents.length > 0 && !td && (
                              <div className="text-[9px] text-gray-400 font-medium">{dayEvents.length}</div>
                            )}
                          </div>
                          <div className="px-1.5 space-y-1">
                            {dayEvents.slice(0, 5).map((e) => {
                              const st = fmtTime(new Date(e.startDate));
                              const endDt = hasValidEndDate(e) ? new Date(e.endDate!) : null;
                              const et = endDt ? fmtTime(endDt) : null;
                              const timeLabel = et
                                ? `${st} → ${et}`
                                : st;
                              const isHovered = hoveredEvent?.id === e.id;
                              return (
                                <div key={e.id} className="relative" onMouseEnter={() => handleHoverStart(e)} onMouseLeave={handleHoverEnd}>
                                  <div
                                    className={`${TYPE_BAR[e.type] || TYPE_BAR.OTHER} ${TYPE_BAR_HOVER[e.type] || TYPE_BAR_HOVER.OTHER} rounded-md text-[11px] font-medium px-2 py-1 border cursor-pointer transition-all flex items-center gap-1.5 ${isHovered ? 'shadow-sm scale-[1.02]' : ''}`}
                                    onClick={(ev) => { ev.stopPropagation(); onView(e); }}
                                  >
                                    <span className={`size-1.5 rounded-full shrink-0 ${TYPE_ACCENT[e.type] || TYPE_ACCENT.OTHER}`} />
                                    <span className="truncate font-medium text-gray-900">{e.name}</span>
                                    <span className="text-[11px] text-gray-600 shrink-0 whitespace-nowrap tabular-nums ml-auto">{timeLabel}</span>
                                  </div>
                                  {isHovered && (
                                    <EventHoverCard event={e} onView={onView} onEdit={onEdit} onMouseEnter={handleTooltipEnter} onMouseLeave={handleTooltipLeave} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {dayEvents.length > 5 && (
                            <div className="text-[9px] text-gray-500 text-center font-medium pt-0.5">+{dayEvents.length - 5}</div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
