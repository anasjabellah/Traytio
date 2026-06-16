'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import type { Commande } from '@/features/commandes/types';

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

const STATUS_CARD: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-800',
  QUOTED: 'bg-blue-100 text-blue-900',
  CONFIRMED: 'bg-emerald-100 text-emerald-900',
  IN_PROGRESS: 'bg-amber-100 text-amber-900',
  READY: 'bg-purple-100 text-purple-900',
  DELIVERED: 'bg-green-100 text-green-900',
  CANCELLED: 'bg-red-100 text-red-900',
};

const STATUS_HOVER: Record<string, string> = {
  DRAFT: 'hover:bg-slate-200',
  QUOTED: 'hover:bg-blue-200',
  CONFIRMED: 'hover:bg-emerald-200',
  IN_PROGRESS: 'hover:bg-amber-200',
  READY: 'hover:bg-purple-200',
  DELIVERED: 'hover:bg-green-200',
  CANCELLED: 'hover:bg-red-200',
};

const MAX_VISIBLE_EVENTS = 3;

interface CommandesCalendarProps {
  data: Commande[];
  loading: boolean;
  onView: (cmd: Commande) => void;
  onEdit: (cmd: Commande) => void;
}

function EventCard({ cmd, onEdit }: { cmd: Commande; onEdit: (cmd: Commande) => void }) {
  const cardBg = STATUS_CARD[cmd.status] || 'bg-slate-100 text-slate-800';
  const cardHover = STATUS_HOVER[cmd.status] || 'hover:bg-slate-200';

  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onEdit(cmd); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdit(cmd); } }}
          className={`
            w-full text-left rounded-lg px-2.5 py-2 shadow-xs cursor-pointer
            transition-all duration-200 ease-out
            hover:-translate-y-px hover:shadow-md
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-deep)]/50
            ${cardBg} ${cardHover}
          `}
        >
          <div className="text-[11px] font-bold tabular-nums truncate tracking-tight">
            {cmd.number}
          </div>
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <span className="text-[10px] opacity-70 truncate min-w-0 font-medium">
              {cmd.clientName || '—'}
            </span>
            <span className="text-[10px] font-bold tabular-nums opacity-80 shrink-0">
              {mad(Number(cmd.totalAmount))}
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" align="center" sideOffset={6} className="max-w-[220px]">
        <div className="space-y-1 py-0.5">
          <span className="font-semibold text-[11px]">{cmd.number}</span>
          <div className="text-[10px] text-background/70 space-y-0.5">
            <div><span className="text-background/50">Client :</span> {cmd.clientName || '—'}</div>
            {cmd.eventDate && (
              <div><span className="text-background/50">Date :</span> {new Date(cmd.eventDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            )}
            {cmd.guestCount && (
              <div><span className="text-background/50">Invités :</span> {cmd.guestCount}</div>
            )}
            <div><span className="text-background/50">Total :</span> {mad(Number(cmd.totalAmount))}</div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function CommandesCalendar({ data, loading, onView, onEdit }: CommandesCalendarProps) {
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
              <div key={i} className="h-[136px] bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delay={400}>
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
                return <div key={idx} className="bg-muted/10 min-h-[136px]" />;
              }
              return (
                <div
                  key={idx}
                  className={`bg-card min-h-[136px] p-1.5 transition-colors ${
                    cell.isToday ? 'ring-1 ring-[var(--gold-deep)]/30 bg-[var(--gold-soft)]/5' : ''
                  }`}
                >
                  <div className={`text-[11px] font-medium mb-1.5 px-1.5 py-0.5 rounded-full w-fit ${
                    cell.isToday
                      ? 'bg-[var(--gold-deep)] text-white'
                      : 'text-muted-foreground/60'
                  }`}>
                    {cell.day}
                  </div>
                  <div className="space-y-1.5">
                    {cell.commandes.slice(0, MAX_VISIBLE_EVENTS).map((cmd) => (
                      <EventCard key={cmd.id} cmd={cmd} onEdit={onEdit} />
                    ))}
                    {cell.commandes.length > MAX_VISIBLE_EVENTS && (
                      <div className="text-[9px] text-muted-foreground/50 font-medium text-center pt-0.5">
                        +{cell.commandes.length - MAX_VISIBLE_EVENTS} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
