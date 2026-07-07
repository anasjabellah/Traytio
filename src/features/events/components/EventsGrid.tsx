'use client';

import { motion } from 'framer-motion';
import { PartyPopper, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { EventsTable } from '@/features/events/components/events-table';
import { Pagination } from '@/components/ui/pagination';
import { usePrivacyMode, SensitiveValue } from '@/components/privacy-mode';
import { STATUS_LABELS, STATUS_COLORS } from '@/features/events/types';
import { formatCurrency } from '@/lib/utils';
import type { Event } from '@/features/events/types';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

function EventsTableSection({ events, isLoading, statusFilter, onEdit, onDelete, pagination, onPageChange, onLimitChange }: {
  events: Event[];
  isLoading: boolean;
  statusFilter: string | null;
  onEdit: (e: Event) => void;
  onDelete: (e: Event) => void;
  pagination: { page: number; totalPages: number; total: number; limit: number };
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
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
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        itemLabel="événement"
      />
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
                {e.guestCount != null ? `${e.guestCount} tables` : ''}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {new Date(e.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="inline-flex items-center gap-1 text-foreground">
                  <TableIcon className="size-3" /> {e.guestCount ?? 0}
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

function TableIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 491.413 491.413" fill="currentColor" className={className}>
      <path d="M491.413,133.867c0-62.4-126.613-96.107-245.653-96.107S0,71.467,0,133.867c0,60.48,118.72,93.973,234.453,96v125.76c-0.213,0.747-0.533,1.387-0.853,2.133c-4.587,0.32-8.533,3.52-9.6,8.107c-1.173,4.16-2.773,8.107-4.8,11.947c-1.067,0.533-2.24,0.853-3.413,1.067c-12.373,1.6-30.08-17.707-36.693-27.307c-3.307-4.907-10.027-6.08-14.827-2.773s-6.08,10.027-2.773,14.827c2.347,3.413,20.373,29.013,42.987,35.2c-13.013,14.08-34.027,28.373-67.84,33.6c-5.867,0.853-9.813,6.293-8.96,12.16c0.747,5.227,5.333,9.067,10.56,9.067c0.533,0,1.067,0,1.6-0.107c56.853-8.64,83.733-39.68,95.787-61.227c3.627-3.093,6.827-6.613,9.387-10.667c2.56,3.947,5.76,7.573,9.387,10.667c12.16,21.547,39.04,52.587,95.893,61.227c0.533,0.107,1.067,0.107,1.6,0.107c5.867,0,10.667-4.8,10.667-10.667c0-5.333-3.84-9.813-9.067-10.56c-33.92-5.227-55.04-19.52-67.947-33.6c22.613-6.293,40.747-31.893,43.093-35.307c3.307-4.8,2.133-11.52-2.667-14.827s-11.52-2.133-14.827,2.773c-6.72,9.6-24.213,28.907-36.693,27.307c-1.173-0.213-2.347-0.533-3.413-1.067c-2.027-3.84-3.627-7.787-4.8-11.947c-1.173-4.587-5.12-7.787-9.707-8.107c-5.44-0.32-9.067-0.533-10.56-2.133v-125.76C372.693,227.84,491.413,194.347,491.413,133.867z M245.76,211.733c-113.173,0-192.853-31.04-204.8-77.867c11.947-46.827,91.627-77.867,204.8-77.867s192.853,31.04,204.8,77.867C438.613,180.693,358.933,211.733,245.76,211.733z" />
    </svg>
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
  events, isLoading, statusFilter, onEdit, onDelete, upcomingSorted, pagination, onPageChange, onLimitChange,
}: {
  events: Event[];
  isLoading: boolean;
  statusFilter: string | null;
  onEdit: (e: Event) => void;
  onDelete: (e: Event) => void;
  upcomingSorted: Event[];
  pagination: { page: number; totalPages: number; total: number; limit: number };
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  return (
    <div className="col-span-12 xl:col-span-9 space-y-6">
      <EventsTableSection
        events={events}
        isLoading={isLoading}
        statusFilter={statusFilter}
        onEdit={onEdit}
        onDelete={onDelete}
        pagination={pagination}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
      {upcomingSorted.length > 0 && (
        <UpcomingEventsSection events={upcomingSorted} />
      )}
      <EventAnalytics events={events} />
    </div>
  );
}
