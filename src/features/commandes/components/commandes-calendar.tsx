'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, CalendarDays } from 'lucide-react';
import { COMMANDE_STATUS_STYLES } from '@/features/commandes/constants';
import type { Commande } from '@/features/commandes/types';

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

interface CommandesCalendarProps {
  data: Commande[];
  loading: boolean;
  onView: (cmd: Commande) => void;
}

export function CommandesCalendar({ data, loading, onView }: CommandesCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const commandesByDate = useMemo(() => {
    const map = new Map<string, Commande[]>();
    for (const cmd of data) {
      if (!cmd.eventDate) continue;
      const key = new Date(cmd.eventDate).toISOString().slice(0, 10);
      const existing = map.get(key);
      if (existing) existing.push(cmd);
      else map.set(key, [cmd]);
    }
    return map;
  }, [data]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const cells: { day: number; dateStr: string; commandes: Commande[]; isToday: boolean; isCurrentMonth: boolean }[] = [];

  const leadingBlanks = firstDay;
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push({ day: 0, dateStr: '', commandes: [], isToday: false, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      day: d,
      dateStr,
      commandes: commandesByDate.get(dateStr) || [],
      isToday: dateStr === todayStr,
      isCurrentMonth: true,
    });
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold">Calendrier</div>
          <h3 className="font-display text-xl mt-0.5">Événements & commandes</h3>
        </div>
        <span className="text-xs text-muted-foreground/60">
          {data.filter((c) => c.eventDate).length} événement{data.filter((c) => c.eventDate).length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center justify-between px-6 pb-4">
        <button
          onClick={prevMonth}
          className="size-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-display text-base">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="size-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/40 font-semibold text-center py-2">
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-border/20 rounded-xl overflow-hidden">
          {cells.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return <div key={idx} className="bg-muted/10 min-h-[100px]" />;
            }
            return (
              <div
                key={idx}
                className={`bg-card min-h-[100px] p-1.5 transition-colors ${
                  cell.isToday ? 'ring-1 ring-[var(--gold-deep)]/30 bg-[var(--gold-soft)]/5' : ''
                }`}
              >
                <div className={`text-[11px] font-medium mb-1 px-1.5 py-0.5 rounded-full w-fit ${
                  cell.isToday
                    ? 'bg-[var(--gold-deep)] text-white'
                    : 'text-muted-foreground'
                }`}>
                  {cell.day}
                </div>
                <div className="space-y-0.5">
                  {cell.commandes.slice(0, 3).map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => onView(cmd)}
                      className="w-full text-left group flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-muted/60 transition-colors"
                    >
                      <span className={`size-1.5 rounded-full shrink-0 ${COMMANDE_STATUS_STYLES[cmd.status]?.includes('bg-emerald-700') ? 'bg-emerald-700' : cmd.status === 'CANCELLED' ? 'bg-red-500' : cmd.status === 'CONFIRMED' ? 'bg-emerald-500' : cmd.status === 'IN_PROGRESS' ? 'bg-amber-500' : cmd.status === 'DRAFT' ? 'bg-gray-400' : cmd.status === 'QUOTED' ? 'bg-blue-500' : cmd.status === 'READY' ? 'bg-violet-500' : 'bg-gray-400'}`} />
                      <span className="text-[10px] truncate flex-1 font-medium text-muted-foreground/80 group-hover:text-foreground transition-colors">
                        {cmd.clientName || cmd.number}
                      </span>
                      <span className="text-[9px] tabular-nums text-muted-foreground/40 shrink-0">
                        {mad(Number(cmd.totalAmount))}
                      </span>
                    </button>
                  ))}
                  {cell.commandes.length > 3 && (
                    <div className="text-[9px] text-muted-foreground/40 px-1.5">
                      +{cell.commandes.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
