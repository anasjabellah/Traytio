'use client';

import { motion } from 'framer-motion';
import { PartyPopper, Users, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { EventsTable } from '@/features/events/components/events-table';
import { usePrivacyMode, SensitiveValue } from '@/components/privacy-mode';
import { STATUS_LABELS, STATUS_COLORS } from '@/features/events/types';
import { formatCurrency } from '@/lib/utils';
import type { Event } from '@/features/events/types';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

function EventsTableSection({ events, isLoading, statusFilter, onEdit, onDelete }: {
  events: Event[];
  isLoading: boolean;
  statusFilter: string | null;
  onEdit: (e: Event) => void;
  onDelete: (e: Event) => void;
}) {
  const { isPrivacyMode } = usePrivacyMode();
  const displayEvents = statusFilter ? events.filter(e => e.status === statusFilter) : events;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold">Liste</div>
          <h3 className="font-display text-xl mt-0.5">Tous les événements</h3>
        </div>
        <span className="text-xs text-muted-foreground/60">{displayEvents.length} résultat{displayEvents.length > 1 ? 's' : ''}</span>
      </div>
      <EventsTable data={displayEvents} loading={isLoading} onEdit={onEdit} onDelete={onDelete} isPrivacyMode={isPrivacyMode} />
    </div>
  );
}

function UpcomingEventsSection({ events }: { events: Event[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Agenda</div>
          <h3 className="font-display text-2xl mt-1">Prochains événements</h3>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {events.map((e, i) => {
          const accent = e.status === 'CONFIRMED';
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`group relative rounded-xl border p-5 overflow-hidden transition-all hover:shadow-lift ${accent ? 'border-gold bg-gradient-to-br from-[var(--gold-soft)]/60 to-transparent' : 'border-border bg-card'}`}
            >
              {accent && <div className="absolute -top-12 -right-12 size-32 rounded-full bg-gradient-gold opacity-20 blur-2xl" />}
              <div className="flex items-start justify-between">
                <PartyPopper className={`size-5 ${accent ? 'text-[var(--gold-deep)]' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[e.status] || 'bg-gray-200 text-gray-800'}`}>
                  {STATUS_LABELS[e.status] || e.status}
                </span>
              </div>
              <div className="mt-4 font-display text-xl leading-tight">{e.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {e.guestCount != null ? `${e.guestCount} invités` : ''}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {new Date(e.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="inline-flex items-center gap-1 text-foreground">
                  <Users className="size-3" /> {e.guestCount ?? 0}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Dans</span>
                <span className={`font-display text-2xl tabular-nums ${e.daysUntil != null && e.daysUntil <= 1 ? 'text-red-600' : e.daysUntil != null && e.daysUntil <= 7 ? 'text-orange-600' : 'text-foreground'}`}>
                  {e.daysUntil != null && e.daysUntil > 0 ? e.daysUntil : 0}
                  <span className={`text-xs ml-1 ${e.daysUntil != null && e.daysUntil <= 1 ? 'text-red-600' : e.daysUntil != null && e.daysUntil <= 7 ? 'text-orange-600' : 'text-muted-foreground'}`}>jour{(e.daysUntil ?? 0) > 1 ? 's' : ''}</span>
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function EventAnalytics({ events }: { events: Event[] }) {
  const { isPrivacyMode } = usePrivacyMode();
  const chiffreAffaires = events.reduce((s, e) => s + (e.status === 'CONFIRMED' || e.status === 'COMPLETED' ? Number(e.budget ?? 0) : 0), 0);
  const totalPaidEvent = events.reduce((s, e) => s + (e.totalPaid ?? 0), 0);
  const totalRemainingEvent = events.reduce((s, e) => s + (e.totalRemaining ?? 0), 0);
  const avgBudgetEvent = events.length > 0 ? Math.round(events.reduce((s, e) => s + Number(e.budget ?? 0), 0) / events.length) : 0;

  const metrics = [
    { label: 'Chiffre d\'affaires', value: events.length ? mad(chiffreAffaires) : mad(0) },
    { label: 'Paiements reçus', value: events.length ? mad(totalPaidEvent) : mad(0) },
    { label: 'Reste à encaisser', value: events.length ? mad(totalRemainingEvent) : mad(0) },
    { label: 'Budget moyen', value: events.length ? mad(avgBudgetEvent) : mad(0) },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Analytics</div>
          <h3 className="font-display text-xl mt-0.5">Finances</h3>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((c, ci) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.08 }}
            className="rounded-xl border border-border/60 p-3.5 bg-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground font-medium">{c.label}</span>
            </div>
            <div className="text-xl font-display tabular-nums">
              <SensitiveValue hidden={isPrivacyMode} className="text-gradient-charcoal">{c.value}</SensitiveValue>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function EventsGrid({
  events, isLoading, statusFilter, onEdit, onDelete, upcomingSorted, allEvents,
}: {
  events: Event[];
  isLoading: boolean;
  statusFilter: string | null;
  onEdit: (e: Event) => void;
  onDelete: (e: Event) => void;
  upcomingSorted: Event[];
  allEvents: Event[];
}) {
  return (
    <div className="col-span-12 xl:col-span-9 space-y-6">
      <EventsTableSection
        events={events}
        isLoading={isLoading}
        statusFilter={statusFilter}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      {upcomingSorted.length > 0 && (
        <UpcomingEventsSection events={upcomingSorted} />
      )}
      <EventAnalytics events={allEvents} />
    </div>
  );
}
