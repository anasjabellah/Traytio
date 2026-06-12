'use client';

import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { SensitiveValue, usePrivacyMode } from '@/components/privacy-mode';
import { formatCurrency } from '@/lib/utils';
import type { Event } from '@/features/events/types';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

function TodayEventsSection({ events }: { events: Event[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Aujourd&apos;hui</div>
          <h3 className="font-display text-xl mt-1">Programme du jour</h3>
        </div>
        <span className="text-xs text-muted-foreground">{events.length}</span>
      </div>
      {events.length === 0 ? (
        <div className="py-8 flex flex-col items-center gap-3 text-center">
          <div className="size-12 rounded-full bg-foreground/[0.03] flex items-center justify-center">
            <CalendarIcon className="size-6 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Aucun événement aujourd&apos;hui</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Programme libre — profitez-en</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {events.map((ev, i) => {
            const d = new Date(ev.startDate);
            const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-foreground/[0.03] cursor-pointer"
                onClick={() => { window.location.href = `/dashboard/events/${ev.id}`; }}
              >
                <div className="text-xs tabular-nums text-muted-foreground w-12 pt-0.5">{time}</div>
                <div className="relative flex-1 pl-3 border-l-2 border-[var(--gold)]/40">
                  <div className="text-sm font-medium leading-tight">{ev.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{ev.guestCount ? `${ev.guestCount} pax` : ''}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuickStatsSection({ stats, totalBudget }: { stats: Array<{ label: string; value: number }>; totalBudget: number }) {
  const { isPrivacyMode } = usePrivacyMode();
  const isMonetary = (label: string) => label === 'Budget moyen';
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Indicateurs</div>
        <h3 className="font-display text-xl mt-1">Stats rapides</h3>
      </div>
      <div className="space-y-4">
        {stats.map((s, i) => {
          const isMoney = isMonetary(s.label);
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium tabular-nums">
                  <SensitiveValue hidden={isPrivacyMode}>{isMoney ? mad(s.value) : `${s.value}`}</SensitiveValue>
                </span>
              </div>
              {isMoney ? (
                <div className="h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((s.value / Math.max(totalBudget, 1)) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                    className="h-full bg-gradient-gold"
                  />
                </div>
              ) : (
                <div className="h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(s.value * 10, 100)}%` }}
                    transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                    className="h-full bg-gradient-gold"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-600" /> Budget total{' '}<SensitiveValue hidden={isPrivacyMode}>{mad(totalBudget)}</SensitiveValue>
        </div>
      </div>
    </div>
  );
}

export function EventsSidebar({
  todayEvents, statsEvents, totalBudget,
}: {
  todayEvents: Event[];
  statsEvents: Array<{ label: string; value: number }>;
  totalBudget: number;
}) {
  return (
    <aside className="col-span-12 xl:col-span-3 space-y-6">
      <div className="xl:sticky xl:top-24 space-y-6">
        <TodayEventsSection events={todayEvents} />
        <QuickStatsSection stats={statsEvents} totalBudget={totalBudget} />
      </div>
    </aside>
  );
}
