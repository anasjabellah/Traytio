'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Calendar as CalendarIcon, FileText, TrendingUp, TrendingDown,
  Users, Wallet, CheckCircle2, Sparkles,
  Search, PartyPopper, X,
  Clock, RefreshCw, SlidersHorizontal, ChevronLeft, ChevronRight,
  Eye, Pencil, MessageCircle, MapPin, User, Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEvents } from '@/features/events/hooks/use-events';
import { useEventForm } from '@/features/events/hooks/use-event-form';
import { CreateEventDialog } from '@/features/events/components/create-event-dialog';
import { EditEventDialog } from '@/features/events/components/edit-event-dialog';
import { DeleteEventDialog } from '@/features/events/components/delete-event-dialog';
import type { Event } from '@/features/events/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/features/events/types';
import { PrivacyModeProvider, EyeToggle, SensitiveValue, usePrivacyMode } from '@/components/privacy-mode';
import { EventsTable } from '@/features/events/components/events-table';
import { useNotificationStore } from '@/stores/notification-store';
import { formatCurrency } from '@/lib/utils';

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

const SPARK_DEFAULTS: Record<string, number[]> = {
  DRAFT: [2, 3, 2, 4, 3, 5, 4],
  PLANNED: [3, 4, 5, 4, 6, 5, 7],
  CONFIRMED: [4, 6, 5, 7, 8, 9, 12],
  IN_PROGRESS: [1, 2, 2, 3, 3, 4, 5],
  COMPLETED: [5, 7, 8, 10, 12, 14, 18],
  CANCELLED: [1, 1, 2, 1, 2, 1, 1],
};

type ViewMode = 'table' | 'calendar';

export default function EventsPage() {
  const router = useRouter();
  const { events, isLoading, pagination, handleSearch, refresh } = useEvents();
  const { isCreateOpen, isEditOpen, isDeleteOpen, selectedEvent, openCreate, openEdit, openDelete, closeAll } = useEventForm();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const filteredEvents = useMemo(() => {
    let result = events;
    if (statusFilter) result = result.filter(e => e.status === statusFilter);
    if (typeFilter) result = result.filter(e => e.type === typeFilter);
    if (paymentFilter) result = result.filter(e => e.paymentStatus === paymentFilter);
    if (dateFrom) result = result.filter(e => new Date(e.startDate) >= new Date(dateFrom));
    if (dateTo) result = result.filter(e => new Date(e.startDate) <= new Date(dateTo));
    if (budgetMin) result = result.filter(e => Number(e.budget ?? 0) >= Number(budgetMin));
    if (budgetMax) result = result.filter(e => Number(e.budget ?? 0) <= Number(budgetMax));
    return result;
  }, [events, statusFilter, typeFilter, paymentFilter, dateFrom, dateTo, budgetMin, budgetMax]);

  const totalEvents = pagination.total;
  const confirmedEvents = events.filter(e => e.status === 'CONFIRMED').length;
  const upcomingEvents = events.filter(e => new Date(e.startDate) > new Date()).length;
  const thisMonthEvents = events.filter(e => {
    const d = new Date(e.startDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalBudget = events.reduce((sum, e) => sum + Number(e.budget || 0), 0);
  const avgBudget = totalEvents > 0 ? Math.round(totalBudget / totalEvents) : 0;
  const activeClients = new Set(events.filter(e => e.clientId && (e.status === 'CONFIRMED' || e.status === 'IN_PROGRESS')).map(e => e.clientId)).size;

  const confirmationRate = totalEvents > 0 ? Math.round((confirmedEvents / totalEvents) * 100) : 0;
  const prevMonthEvents = events.filter(e => {
    const d = new Date(e.startDate);
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d >= prev && d < new Date(now.getFullYear(), now.getMonth(), 1);
  }).length;
  const eventGrowth = prevMonthEvents > 0 ? Math.round(((thisMonthEvents - prevMonthEvents) / prevMonthEvents) * 100) : thisMonthEvents > 0 ? 100 : 0;

  const handleView = (event: Event) => { router.push(`/dashboard/events/${event.id}`); };

  const eventTrend: 'up' | 'down' = eventGrowth >= 0 ? 'up' : 'down';
  const KPIS = [
    { label: "Total événements", value: totalEvents, delta: eventGrowth, trend: eventTrend, spark: SPARK_DEFAULTS.CONFIRMED, icon: PartyPopper, accent: true, sensitive: false },
    { label: "À venir", value: upcomingEvents, delta: 0, trend: 'up' as 'up' | 'down', spark: SPARK_DEFAULTS.PLANNED, icon: CalendarIcon, sensitive: false },
    { label: "Confirmés", value: confirmedEvents, delta: confirmationRate, trend: 'up' as 'up' | 'down', spark: SPARK_DEFAULTS.CONFIRMED, icon: CheckCircle2, sensitive: true },
    { label: "Budget total", value: totalBudget, prefix: "MAD", delta: 0, trend: 'up' as 'up' | 'down', spark: SPARK_DEFAULTS.COMPLETED, icon: Wallet, sensitive: true },
    { label: "Clients actifs", value: activeClients, delta: 0, trend: 'up' as 'up' | 'down', spark: SPARK_DEFAULTS.CONFIRMED, icon: Users, sensitive: false },
  ];

  const today = useMemo(() => new Date(), []);
  const todayEvents = events.filter(e => {
    const d = new Date(e.startDate);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const upcomingSorted = [...events]
    .filter(e => new Date(e.startDate) > today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  // Compute alerts from real data
  const alerts = useMemo(() => {
    const result: Array<{ type: 'warn' | 'danger' | 'info'; title: string; text: string }> = [];
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const seen = new Set<string>();
    const add = (type: 'warn' | 'danger' | 'info', title: string, text: string) => {
      const key = `${title}:${text}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push({ type, title, text });
    };

    for (const e of events) {
      const d = new Date(e.startDate);
      if (d > today && d <= sevenDaysFromNow) {
        add('warn', '⚠ Événement imminent', `${e.name} — ${e.clientName || 'Client'} (J-${Math.ceil((d.getTime() - today.getTime()) / 86400000)})`);
      }
      if (e.paymentStatus === 'UNPAID' && e.status !== 'DRAFT' && e.status !== 'CANCELLED') {
        add('danger', '⚠ Paiement manquant', `${e.name} — ${e.clientName || 'Client'}`);
      }
      if (!e.clientId) {
        add('info', '⚠ Client manquant', e.name);
      }
      if (!e.budget || Number(e.budget) === 0) {
        add('info', '⚠ Budget manquant', e.name);
      }
      if (!e.guestCount || e.guestCount === 0) {
        add('info', '⚠ Invités manquants', e.name);
      }
      if (!e.hasLinkedCommande && e.status !== 'DRAFT' && e.status !== 'CANCELLED') {
        add('warn', '⚠ Commande manquante', e.name);
      }
    }
    // Double booking detection
    const dateMap = new Map<string, string[]>();
    for (const e of events) {
      const key = new Date(e.startDate).toLocaleDateString('fr-FR');
      if (!dateMap.has(key)) dateMap.set(key, []);
      dateMap.get(key)!.push(e.name);
    }
    for (const [date, names] of dateMap) {
      if (names.length >= 2) {
        add('danger', '⚠ Double réservation', `${date} — ${names.length} événements`);
      }
    }
    return result.slice(0, 4);
  }, [events, today]);

  const setNotifications = useNotificationStore((s) => s.setNotifications);
  useEffect(() => { setNotifications(alerts); }, [alerts, setNotifications]);

  const STATS_EVENTS = [
    { label: "Budget moyen", value: avgBudget },
    { label: "Événements mensuels", value: thisMonthEvents },
  ];

  const statusKeys = Object.keys(STATUS_LABELS);
  const eventTypeKeys: string[] = ['WEDDING', 'CORPORATE', 'BIRTHDAY', 'ANNIVERSARY', 'HOLIDAY', 'OTHER'];
  const EVENT_TYPE_LABELS: Record<string, string> = {
    WEDDING: 'Mariage', CORPORATE: 'Entreprise', BIRTHDAY: 'Anniversaire',
    ANNIVERSARY: 'Anniversaire', HOLIDAY: 'Gala', OTHER: 'Autre',
  };

  return (
    <PrivacyModeProvider>
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
            <Button variant="outline" className="h-10 rounded-lg border-border bg-background/60 backdrop-blur" onClick={() => setViewMode('calendar')}>
              <CalendarIcon className="size-4" /> Calendrier
            </Button>
            <Button variant="outline" className="h-10 rounded-lg border-border bg-background/60 backdrop-blur" onClick={() => { const csv = events.map(e => `${e.name},${e.status},${new Date(e.startDate).toISOString()},${e.guestCount ?? 0},${Number(e.budget ?? 0)},${e.paymentStatus ?? ''}`).join('\n'); const blob = new Blob(['Nom,Statut,Date,Invites,Budget,Paiement\n' + csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'evenements.csv'; a.click(); URL.revokeObjectURL(url); }}>
              <FileText className="size-4" /> Exporter
            </Button>
            <EyeToggle />
            <Button onClick={openCreate} className="h-10 rounded-lg bg-gradient-charcoal text-white shadow-lift hover:opacity-95">
              <Plus className="size-4" /> Nouvel événement
            </Button>
          </div>
        </div>

        {/* KPI grid */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {KPIS.map((k, i) => (
            <KpiCard key={k.label} {...k} delay={i * 0.05} />
          ))}
        </div>

        {/* Search + Filters + View toggle */}
        <div className="mt-8 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2 px-4 h-11 rounded-xl border border-border bg-card shadow-soft flex-1 max-w-[420px] transition-all focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/30">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom, client, téléphone, lieu..."
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="size-5 rounded-full hover:bg-secondary flex items-center justify-center">
                <X className="size-3 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 rounded-xl gap-2 px-4 ${showFilters ? 'bg-foreground text-background hover:bg-foreground/90' : ''}`}
            >
              <SlidersHorizontal className="size-3.5" />
              Filtres
            </Button>
            <button
              onClick={() => refresh()}
              className="size-11 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors flex items-center justify-center"
              title="Rafraîchir"
            >
              <RefreshCw className="size-3.5" />
            </button>
            <div className="flex p-0.5 rounded-xl bg-foreground/[0.04] border border-border">
              <button
                onClick={() => setViewMode('table')}
                className={`h-10 px-4 rounded-[10px] text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`h-10 px-4 rounded-[10px] text-sm font-medium transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Calendrier
              </button>
            </div>
          </div>
        </div>

        {/* Advanced filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="rounded-2xl border border-border bg-card shadow-soft p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Statut</div>
                    <select
                      value={statusFilter ?? ''}
                      onChange={(e) => setStatusFilter(e.target.value || null)}
                      className="w-full h-9 rounded-lg border border-border bg-surface-soft px-3 text-xs focus:outline-none focus:border-gold"
                    >
                      <option value="">Tous</option>
                      {statusKeys.map((key) => (
                        <option key={key} value={key}>{STATUS_LABELS[key]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Type</div>
                    <select
                      value={typeFilter ?? ''}
                      onChange={(e) => setTypeFilter(e.target.value || null)}
                      className="w-full h-9 rounded-lg border border-border bg-surface-soft px-3 text-xs focus:outline-none focus:border-gold"
                    >
                      <option value="">Tous</option>
                      {eventTypeKeys.map((key) => (
                        <option key={key} value={key}>{EVENT_TYPE_LABELS[key]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Paiement</div>
                    <select
                      value={paymentFilter ?? ''}
                      onChange={(e) => setPaymentFilter(e.target.value || null)}
                      className="w-full h-9 rounded-lg border border-border bg-surface-soft px-3 text-xs focus:outline-none focus:border-gold"
                    >
                      <option value="">Tous</option>
                      <option value="PAID">Payé</option>
                      <option value="PARTIAL">Partiel</option>
                      <option value="UNPAID">Impayé</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Du</div>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full h-9 rounded-lg border border-border bg-surface-soft px-3 text-xs focus:outline-none focus:border-gold [color-scheme:light]"
                    />
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Au</div>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full h-9 rounded-lg border border-border bg-surface-soft px-3 text-xs focus:outline-none focus:border-gold [color-scheme:light]"
                    />
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Budget min</div>
                    <input
                      type="number"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      placeholder="0"
                      className="w-full h-9 rounded-lg border border-border bg-surface-soft px-3 text-xs focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Budget max</div>
                    <input
                      type="number"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      placeholder="999999"
                      className="w-full h-9 rounded-lg border border-border bg-surface-soft px-3 text-xs focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => {
                      setStatusFilter(null); setTypeFilter(null); setPaymentFilter(null);
                      setDateFrom(''); setDateTo(''); setBudgetMin(''); setBudgetMax('');
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main grid — conditional on view mode */}
        {viewMode === 'calendar' ? (
          <CalendarView events={filteredEvents} isLoading={isLoading} onView={handleView} onEdit={openEdit} />
        ) : (
          <div className="mt-8 grid grid-cols-12 gap-6">
            <div className="col-span-12 xl:col-span-9 space-y-6">
              <EventsTableSection
                events={filteredEvents}
                isLoading={isLoading}
                statusFilter={statusFilter}
                onEdit={openEdit}
                onDelete={openDelete}
              />
              {upcomingSorted.length > 0 && (
                <UpcomingEventsSection events={upcomingSorted} />
              )}
              <EventAnalytics events={events} />
            </div>
            <aside className="col-span-12 xl:col-span-3 space-y-6">
              <div className="xl:sticky xl:top-24 space-y-6">
                <TodayEventsSection events={todayEvents} />
                <QuickStatsSection stats={STATS_EVENTS} totalBudget={totalBudget} />
              </div>
            </aside>
          </div>
        )}

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
    </PrivacyModeProvider>
  );
}

/* ---------------- KPI card ---------------- */
function KpiCard({ label, value, prefix, delta, trend, spark, icon: Icon, accent, delay, sensitive }: {
  label: string; value: number; prefix?: string; delta: number; trend: 'up' | 'down';
  spark: number[]; icon: React.ComponentType<{ className?: string }>; accent?: boolean; delay: number; sensitive: boolean;
}) {
  const counted = useCounter(value, 1400);
  const display = prefix ? mad(Math.round(counted)) : Math.round(counted).toLocaleString('fr-FR');
  const up = trend === 'up';
  const { isPrivacyMode } = usePrivacyMode();
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
          <div className="mt-3 font-display text-4xl tabular-nums">
            <SensitiveValue hidden={sensitive && isPrivacyMode} className="text-gradient-charcoal">{display}</SensitiveValue>
          </div>
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

/* ---------------- Events table (wraps shadcn EventsTable) ---------------- */
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

/* ---------------- Event analytics ---------------- */
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

/* ---------------- Right rail: today's events ---------------- */
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

/* ---------------- Quick stats ---------------- */
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

/* ---------------- Calendar view (monthly grid) ---------------- */

const TYPE_BAR: Record<string, string> = {
  WEDDING: 'bg-rose-50 border-rose-300 text-rose-900',
  CORPORATE: 'bg-blue-50 border-blue-300 text-blue-900',
  BIRTHDAY: 'bg-purple-50 border-purple-300 text-purple-900',
  ANNIVERSARY: 'bg-amber-50 border-amber-300 text-amber-900',
  HOLIDAY: 'bg-orange-50 border-orange-300 text-orange-900',
  OTHER: 'bg-gray-50 border-gray-300 text-gray-800',
};
const TYPE_BAR_HOVER: Record<string, string> = {
  WEDDING: 'hover:bg-rose-100 hover:border-rose-400',
  CORPORATE: 'hover:bg-blue-100 hover:border-blue-400',
  BIRTHDAY: 'hover:bg-purple-100 hover:border-purple-400',
  ANNIVERSARY: 'hover:bg-amber-100 hover:border-amber-400',
  HOLIDAY: 'hover:bg-orange-100 hover:border-orange-400',
  OTHER: 'hover:bg-gray-100 hover:border-gray-400',
};
const TYPE_ACCENT: Record<string, string> = {
  WEDDING: 'bg-rose-400', CORPORATE: 'bg-blue-400', BIRTHDAY: 'bg-purple-400',
  ANNIVERSARY: 'bg-amber-400', HOLIDAY: 'bg-orange-400', OTHER: 'bg-gray-400',
};
const TYPE_LABEL: Record<string, string> = {
  WEDDING: 'Mariage', CORPORATE: 'Corporate', BIRTHDAY: 'Anniversaire',
  ANNIVERSARY: 'Anniversaire', HOLIDAY: 'Vacances', OTHER: 'Autre',
};

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
  const typeStyle = TYPE_BAR[event.type] || TYPE_BAR.OTHER;
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

function CalendarView({ events, isLoading, onView, onEdit }: {
  events: Event[];
  isLoading: boolean;
  onView: (e: Event) => void;
  onEdit: (e: Event) => void;
}) {
  const router = useRouter();
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
