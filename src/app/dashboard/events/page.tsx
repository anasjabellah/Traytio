'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus, Calendar as CalendarIcon, FileText, TrendingUp, TrendingDown,
  Users, Wallet, CheckCircle2, ChevronRight, Sparkles, Crown,
  Search, PartyPopper, Filter, X, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEvents } from '@/features/events/hooks/use-events';
import { useEventForm } from '@/features/events/hooks/use-event-form';
import { CreateEventDialog } from '@/features/events/components/create-event-dialog';
import { EditEventDialog } from '@/features/events/components/edit-event-dialog';
import { DeleteEventDialog } from '@/features/events/components/delete-event-dialog';
import type { Event } from '@/features/events/types';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

function useCounter(target: number, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', PLANNED: 'Planifié', CONFIRMED: 'Confirmé',
  IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', CANCELLED: 'Annulé',
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 ring-1 ring-gray-300/50',
  PLANNED: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50',
  COMPLETED: 'bg-emerald-800 text-white ring-1 ring-emerald-900/50',
  CANCELLED: 'bg-red-50 text-red-700 ring-1 ring-red-200/50',
};

const SPARK_DEFAULTS: Record<string, number[]> = {
  DRAFT: [2, 3, 2, 4, 3, 5, 4],
  PLANNED: [3, 4, 5, 4, 6, 5, 7],
  CONFIRMED: [4, 6, 5, 7, 8, 9, 12],
  IN_PROGRESS: [1, 2, 2, 3, 3, 4, 5],
  COMPLETED: [5, 7, 8, 10, 12, 14, 18],
  CANCELLED: [1, 1, 2, 1, 2, 1, 1],
};

export default function EventsPage() {
  const router = useRouter();
  const { events, isLoading, error, pagination, handleSearch, handlePageChange, refresh } = useEvents();
  const { isCreateOpen, isEditOpen, isDeleteOpen, selectedEvent, openCreate, openEdit, openDelete, closeAll } = useEventForm();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const filteredEvents = useMemo(() => {
    if (!statusFilter) return events;
    return events.filter(e => e.status === statusFilter);
  }, [events, statusFilter]);

  const totalEvents = pagination.total;
  const confirmedEvents = events.filter(e => e.status === 'CONFIRMED').length;
  const thisMonthEvents = events.filter(e => {
    const d = new Date(e.startDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalBudget = events.reduce((sum, e) => sum + Number(e.budget || 0), 0);

  const handleView = (event: Event) => { router.push(`/dashboard/events/${event.id}`); };

  const KPIS = [
    { label: "Total événements", value: totalEvents, delta: 12.4, trend: "up" as const, spark: SPARK_DEFAULTS.CONFIRMED, icon: PartyPopper, accent: true },
    { label: "Confirmés", value: confirmedEvents, delta: 8.2, trend: "up" as const, spark: SPARK_DEFAULTS.CONFIRMED, icon: CheckCircle2 },
    { label: "Ce mois-ci", value: thisMonthEvents, delta: 4.1, trend: "up" as const, spark: SPARK_DEFAULTS.PLANNED, icon: CalendarIcon },
    { label: "Budget total", value: totalBudget, prefix: "MAD", delta: 14.7, trend: "up" as const, spark: SPARK_DEFAULTS.COMPLETED, icon: Wallet },
  ];

  const today = new Date();
  const todayEvents = events.filter(e => {
    const d = new Date(e.startDate);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const upcomingSorted = [...events]
    .filter(e => new Date(e.startDate) > today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  const STATS_EVENTS = [
    { label: "Taux de confirmation", value: totalEvents ? Math.round((confirmedEvents / totalEvents) * 100) : 0 },
    { label: "Budget moyen", value: totalEvents ? Math.round(totalBudget / totalEvents) : 0 },
    { label: "Jours de création moyen", value: 14 },
  ];

  const statusKeys = Object.keys(STATUS_LABELS);

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">

        {/* Hero */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Sparkles className="size-3.5 text-[var(--gold-deep)]" />
              <span>Gestion des événements • {pagination.total} au total</span>
            </div>
            <h1 className="font-display text-5xl lg:text-6xl text-gradient-charcoal leading-[1.05]">
              Événements
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Créez, planifiez et suivez l&apos;ensemble de vos événements traiteur en un coup d&apos;œil.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-10 rounded-lg border-border bg-background/60 backdrop-blur">
              <CalendarIcon className="size-4" /> Calendrier
            </Button>
            <Button variant="outline" className="h-10 rounded-lg border-border bg-background/60 backdrop-blur">
              <FileText className="size-4" /> Exporter
            </Button>
            <Button onClick={openCreate} className="h-10 rounded-lg bg-gradient-charcoal text-white shadow-lift hover:opacity-95">
              <Plus className="size-4" /> Nouvel événement
            </Button>
          </div>
        </div>

        {/* KPI grid */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIS.map((k, i) => (
            <KpiCard key={k.label} {...k} delay={i * 0.05} />
          ))}
        </div>

        {/* Search + Filters */}
        <div className="mt-8 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2 px-4 h-11 rounded-2xl border border-border bg-card shadow-soft flex-1 max-w-md transition-all focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/30">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un événement..."
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="size-5 rounded-full hover:bg-secondary flex items-center justify-center">
                <X className="size-3 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
              <Filter className="size-3 inline mr-1" />Statut
            </span>
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${!statusFilter ? 'bg-foreground text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Tous
            </button>
            {statusKeys.map((key) => (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${statusFilter === key ? 'bg-foreground text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {STATUS_LABELS[key]}
              </button>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-8 grid grid-cols-12 gap-6">
          {/* Main column */}
          <div className="col-span-12 xl:col-span-9 space-y-6">

            {/* Events table */}
            <EventsTableSection
              events={filteredEvents}
              isLoading={isLoading}
              statusFilter={statusFilter}
              onView={handleView}
              onEdit={openEdit}
              onDelete={openDelete}
            />

            {/* Upcoming events */}
            {upcomingSorted.length > 0 && (
              <UpcomingEventsSection events={upcomingSorted} />
            )}

            {/* Event analytics */}
            <EventAnalytics events={events} />

          </div>

          {/* Right rail */}
          <aside className="col-span-12 xl:col-span-3 space-y-6">
            <div className="xl:sticky xl:top-24 space-y-6">
              <TodayEventsSection events={todayEvents} />
              <QuickStatsSection stats={STATS_EVENTS} totalBudget={totalBudget} />
            </div>
          </aside>
        </div>

        <footer className="mt-16 mb-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Tous les services opérationnels
          </div>
          <div>© TUR — Suite traiteur premium</div>
        </footer>
      </div>

      {/* Dialogs */}
      <CreateEventDialog open={isCreateOpen} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      {isEditOpen && (
        <EditEventDialog event={selectedEvent} open={isEditOpen} onClose={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
      {isDeleteOpen && selectedEvent && (
        <DeleteEventDialog event={selectedEvent} open={true} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
    </div>
  );
}

/* ---------------- KPI card ---------------- */
function KpiCard({ label, value, prefix, delta, trend, spark, icon: Icon, accent, delay }: any) {
  const counted = useCounter(value, 1400);
  const display = prefix ? mad(Math.round(counted)) : Math.round(counted).toLocaleString('fr-FR');
  const up = trend === 'up';
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft hover:shadow-lift transition-all ${accent ? 'border-gold' : 'border-border'}`}
    >
      {accent && (
        <div className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-gradient-gold opacity-20 blur-2xl" />
      )}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-3 font-display text-4xl text-gradient-charcoal tabular-nums">{display}</div>
        </div>
        <div className={`size-10 rounded-xl flex items-center justify-center ${accent ? 'bg-gradient-gold text-[var(--gold-foreground)]' : 'bg-foreground/[0.04] text-foreground'}`}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${up ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
          {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {up ? '+' : ''}{delta}%
        </div>
        <Sparkline data={spark} up={up} />
      </div>
    </motion.div>
  );
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const w = 96, h = 32, pad = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((d, i) => {
    const x = pad + (i * (w - pad * 2)) / (data.length - 1);
    const y = h - pad - ((d - min) / Math.max(1, max - min)) * (h - pad * 2);
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const fill = `${path} L${w - pad},${h} L${pad},${h} Z`;
  const stroke = up ? 'rgb(16 185 129)' : 'rgb(244 63 94)';
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${up ? 'u' : 'd'}-ev`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${up ? 'u' : 'd'}-ev)`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- Events table ---------------- */
function EventsTableSection({ events, isLoading, statusFilter, onView, onEdit, onDelete }: {
  events: Event[];
  isLoading: boolean;
  statusFilter: string | null;
  onView: (e: Event) => void;
  onEdit: (e: Event) => void;
  onDelete: (e: Event) => void;
}) {
  const displayEvents = statusFilter ? events.filter(e => e.status === statusFilter) : events;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="p-6 pb-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Liste</div>
          <h3 className="font-display text-2xl mt-1">Tous les événements</h3>
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 px-6 py-4 animate-pulse">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="h-4 bg-foreground/[0.05] rounded col-span-2 mx-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (displayEvents.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-soft p-12 flex flex-col items-center gap-4">
        <PartyPopper className="size-10 text-muted-foreground" />
        <p className="font-display text-xl">Aucun événement trouvé</p>
        <p className="text-sm text-muted-foreground">Commencez par créer un événement.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Liste</div>
          <h3 className="font-display text-2xl mt-1">Tous les événements</h3>
        </div>
        <span className="text-xs text-muted-foreground">{displayEvents.length} résultat{displayEvents.length > 1 ? 's' : ''}</span>
      </div>
      <div className="divide-y divide-border">
        <div className="grid grid-cols-12 px-6 py-3 text-[10px] uppercase tracking-wider text-muted-foreground bg-foreground/[0.02]">
          <div className="col-span-3">Nom</div>
          <div className="col-span-2">Client</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1 text-center">Invit{'\u00e9'}s</div>
          <div className="col-span-2 text-right">Budget</div>
          <div className="col-span-1 text-center">Statut</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        {displayEvents.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.03 * i }}
            className="grid grid-cols-12 items-center px-6 py-4 hover:bg-foreground/[0.02] transition-colors group cursor-pointer"
            onClick={() => onView(event)}
          >
            <div className="col-span-3 flex items-center gap-2 text-sm font-medium truncate">
              <div className="size-7 rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center text-[10px] font-medium shrink-0">
                {event.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <span className="truncate">{event.name}</span>
            </div>
            <div className="col-span-2 text-sm text-muted-foreground truncate">
              {event.clientId ? (
                <span className="flex items-center gap-1">
                  <Crown className="size-3 text-[var(--gold-deep)] shrink-0" />
                  <span className="truncate">Client #{event.clientId.slice(0, 6)}</span>
                </span>
              ) : (
                <span className="text-muted-foreground/50">Non assigné</span>
              )}
            </div>
            <div className="col-span-2 text-sm text-muted-foreground tabular-nums">
              {new Date(event.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div className="col-span-1 text-sm text-muted-foreground text-center tabular-nums">
              {event.guestCount ?? <span className="opacity-40">—</span>}
            </div>
            <div className="col-span-2 text-sm font-medium text-right tabular-nums">
              {event.budget ? mad(Number(event.budget)) : <span className="opacity-40">—</span>}
            </div>
            <div className="col-span-1 flex justify-center">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLES[event.status] || 'bg-foreground/[0.05] text-muted-foreground'}`}>
                {STATUS_LABELS[event.status] || event.status}
              </span>
            </div>
            <div className="col-span-1 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onView(event)}
                className="size-7 rounded-md hover:bg-foreground/[0.05] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Voir"
              >
                <Eye className="size-3.5" />
              </button>
              <button
                onClick={() => onEdit(event)}
                className="size-7 rounded-md hover:bg-foreground/[0.05] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Modifier"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 012.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(event)}
                className="size-7 rounded-md hover:bg-red-50 flex items-center justify-center text-muted-foreground hover:text-red-600 transition-colors"
                title="Supprimer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <ChevronRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Upcoming events ---------------- */
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
          const daysUntil = Math.ceil((new Date(e.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLES[e.status] ?? 'bg-foreground/[0.05] text-muted-foreground'}`}>
                  {STATUS_LABELS[e.status] || e.status}
                </span>
              </div>
              <div className="mt-4 font-display text-xl leading-tight">{e.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {e.guestCount ? `${e.guestCount} invités` : ''}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {new Date(e.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="inline-flex items-center gap-1 text-foreground">
                  <Users className="size-3" /> {e.guestCount ?? '—'}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Dans</span>
                <span className="font-display text-2xl tabular-nums">
                  {daysUntil < 0 ? 0 : daysUntil}
                  <span className="text-xs text-muted-foreground ml-1">jour{daysUntil > 1 ? 's' : ''}</span>
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Event analytics ---------------- */
function EventAnalytics({ events }: { events: Event[] }) {
  const byMonth: Record<string, number> = {};
  events.forEach((e) => {
    const d = new Date(e.startDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth[key] = (byMonth[key] || 0) + 1;
  });
  const months = Object.keys(byMonth).sort().slice(-6);
  const data = months.map((m) => byMonth[m]);
  const max = Math.max(...data, 1);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Analytics</div>
          <h3 className="font-display text-2xl mt-1">Création d'événements</h3>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          [
            { label: 'Taux confirmation', value: events.length ? `${Math.round((events.filter(e => e.status === 'CONFIRMED').length / events.length) * 100)}%` : '0%' },
            { label: 'Budget moyen', value: events.length ? mad(Math.round(events.reduce((a, e) => a + Number(e.budget || 0), 0) / events.length)) : mad(0) },
            { label: 'Événements / mois', value: `${Math.round(events.length / Math.max(1, months.length))}` },
            { label: "Taux d'occupation", value: events.length ? `${Math.round(((events.filter(e => e.status === 'CONFIRMED' || e.status === 'IN_PROGRESS').length) / events.length) * 100)}%` : '0%' },
          ] as Array<{ label: string; value: string }>
        ).map((c, ci) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.08 }}
            className="rounded-xl border border-border p-4 bg-[var(--surface-elevated)]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <div className="text-2xl font-display text-gradient-charcoal tabular-nums">{c.value}</div>
          </motion.div>
        ))}
      </div>
      {months.length > 1 && (
        <div className="mt-6">
          <div className="flex items-end gap-2 h-32">
            {months.map((m, i) => {
              const v = byMonth[m];
              return (
                <motion.div
                  key={m}
                  initial={{ height: 0 }}
                  animate={{ height: `${(v / max) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: 'easeOut' }}
                  className="flex-1 rounded-t-md flex items-end justify-center"
                  style={{ background: `linear-gradient(180deg, oklch(0.65 0.13 78), oklch(0.65 0.13 78 / 0.3))` }}
                >
                  <span className="text-[10px] text-muted-foreground pb-1">{v}</span>
                </motion.div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            {months.map((m) => (
              <span key={m}>{m.split('-')[1]}/{m.split('-')[0].slice(2)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Right rail: today's events ---------------- */
function TodayEventsSection({ events }: { events: Event[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Aujourd'hui</div>
          <h3 className="font-display text-xl mt-1">Programme du jour</h3>
        </div>
        <span className="text-xs text-muted-foreground">{events.length}</span>
      </div>
      {events.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          Aucun événement programmé aujourd'hui
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

/* ---------------- Quick stats ---------------- */
function QuickStatsSection({ stats, totalBudget }: { stats: Array<{ label: string; value: number }>; totalBudget: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Indicateurs</div>
        <h3 className="font-display text-xl mt-1">Stats rapides</h3>
      </div>
      <div className="space-y-4">
        {stats.map((s, i) => {
          const capped = Math.min(s.value, 100);
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium tabular-nums">
                  {s.label === 'Budget moyen' ? mad(s.value) : `${s.value}%`}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${capped}%` }}
                  transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                  className="h-full bg-gradient-gold"
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-600" /> Budget total {mad(totalBudget)}
        </div>
      </div>
    </div>
  );
}
