'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, TrendingUp, TrendingDown, Users, Wallet, CheckCircle2, Sparkles,
  Search, X, RefreshCw, SlidersHorizontal, UserPlus, Building2,
  MapPin, Clock, User, Crown, ArrowUpRight, PartyPopper, Mail, Phone,
  CreditCard, Calendar, UserCheck, ShoppingCart, Pencil, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClients } from '@/features/clients/hooks/use-clients';
import { useClientForm } from '@/features/clients/hooks/use-client-form';
import { ClientsTable } from '@/features/clients/components/clients-table';
import { CreateClientDialog } from '@/features/clients/components/create-client-dialog';
import { EditClientDialog } from '@/features/clients/components/edit-client-dialog';
import { DeleteClientDialog } from '@/features/clients/components/delete-client-dialog';
import { getClientStats } from '@/features/clients/actions/get-client-stats';
import { getClientActivity } from '@/features/clients/actions/get-client-activity';
import type { ClientWithStats, Client } from '@/features/clients/types';
import type { ClientStats } from '@/features/clients/actions/get-client-stats';
import type { ActivityItem } from '@/features/clients/actions/get-client-activity';
import { PrivacyModeProvider, EyeToggle, usePrivacyMode } from '@/components/privacy-mode';

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
  up: [2, 3, 4, 3, 5, 4, 6],
  down: [5, 4, 3, 4, 2, 3, 2],
  steady: [3, 3, 4, 4, 3, 4, 4],
};

const SORT_OPTIONS = [
  { value: 'name', label: 'Nom' },
  { value: 'createdAt', label: 'Date de création' },
  { value: 'totalSpent', label: 'Total dépensé' },
  { value: 'lastOrderAt', label: 'Dernière activité' },
] as const;

export default function ClientsPage() {
  const router = useRouter();
  const { clients, isLoading, pagination, handleSearch, refresh } = useClients();
  const {
    isCreateOpen, isEditOpen, isDeleteOpen, selectedClient,
    openCreate, openEdit, openDelete, closeAll,
  } = useClientForm();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const { isPrivacyMode } = usePrivacyMode();

  useEffect(() => {
    getClientStats().then(setStats);
    getClientActivity().then(setActivities);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const filteredClients = useMemo(() => {
    let result = clients;
    if (sortBy === 'totalSpent') result = [...result].sort((a, b) => Number(b.totalSpent) - Number(a.totalSpent));
    else if (sortBy === 'name') result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'lastOrderAt') {
      result = [...result].sort((a, b) => {
        if (!a.lastOrderAt) return 1;
        if (!b.lastOrderAt) return -1;
        return new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime();
      });
    }
    return result;
  }, [clients, sortBy]);

  const totalClients = pagination.total;
  const activeClientsCount = stats?.activeClients ?? clients.filter(c =>
    c.lastOrderAt && new Date(c.lastOrderAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  ).length;
  const totalRevenue = stats?.totalRevenue ?? clients.reduce((s, c) => s + Number(c.totalSpent), 0);
  const avgValue = stats?.averageValue ?? (totalClients > 0 ? totalRevenue / totalClients : 0);
  const newClients30d = stats?.newClients30d ?? clients.filter(c =>
    new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;
  const activePct = totalClients > 0 ? Math.round((activeClientsCount / totalClients) * 100) : 0;
  const totalCommandes = stats?.totalCommandes ?? clients.reduce((s, c) => s + c.commandesCount, 0);

  const handleView = useCallback((client: ClientWithStats) => {
    router.push(`/dashboard/clients/${client.id}`);
  }, [router]);

  const recentClients = useMemo(() =>
    [...clients]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  [clients]);

  const topCity = stats?.topCity ?? (() => {
    const map = new Map<string, number>();
    for (const c of clients) { if (c.city) map.set(c.city, (map.get(c.city) || 0) + 1); }
    let best = '', bestCount = 0;
    for (const [city, count] of map) { if (count > bestCount) { best = city; bestCount = count; } }
    return best || '—';
  })();

  const isSearching = searchQuery.length > 0;
  const hasNoResults = !isLoading && isSearching && filteredClients.length === 0;
  const hasNoClients = !isLoading && !isSearching && clients.length === 0;

  const KPIS = [
    { label: "Total Clients", value: totalClients, delta: stats?.growthRate ?? 0, trend: (stats?.growthRate ?? 0) >= 0 ? 'up' as const : 'down' as const, spark: SPARK_DEFAULTS.up, icon: Users, accent: true },
    { label: "Clients Actifs", value: activeClientsCount, delta: activePct, trend: activePct >= 50 ? 'up' as const : 'down' as const, spark: SPARK_DEFAULTS.steady, icon: CheckCircle2 },
    { label: "Chiffre d'Affaires", value: totalRevenue, prefix: "MAD", delta: stats ? Math.round((totalRevenue / Math.max(stats.totalRevenue || totalRevenue, 1)) * 100) : 0, trend: 'up' as const, spark: SPARK_DEFAULTS.up, icon: Wallet, accent: true },
    { label: "Nouveaux (30j)", value: newClients30d, delta: stats ? Math.round((newClients30d / Math.max(stats.newClients30d || newClients30d, 1)) * 100) : 0, trend: newClients30d > 0 ? 'up' as const : 'down' as const, spark: SPARK_DEFAULTS.up, icon: UserPlus },
    { label: "Commandes", value: totalCommandes, delta: 0, trend: totalCommandes > 0 ? 'up' as const : 'down' as const, spark: SPARK_DEFAULTS.up, icon: ShoppingCart },
  ];

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
              <span>Gestion des clients • {pagination.total} au total</span>
            </div>
            <h1 className="font-display text-5xl lg:text-6xl text-gradient-charcoal leading-[1.05]">
              Clients
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Gérez, suivez et développez votre portefeuille clients.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-lg border-border bg-background/60 backdrop-blur"
              onClick={() => {
                const csv = clients.map(c =>
                  `${c.name},${c.company || ''},${c.email || ''},${c.phone || ''},${c.city || ''},${Number(c.totalSpent)}`
                ).join('\n');
                const blob = new Blob(['Nom,Compagnie,Email,Téléphone,Ville,Total dépensé\n' + csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'clients.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <FileText className="size-4" /> Exporter
            </Button>
            <EyeToggle />
            <Button onClick={openCreate} className="h-10 rounded-lg bg-gradient-charcoal text-white shadow-lift hover:opacity-95 gap-2 px-4">
              <Plus className="size-4" /> Nouveau client
            </Button>
          </div>
        </div>

        {/* KPI grid */}
        {!isPrivacyMode && (
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {KPIS.map((k, i) => (
            <KpiCard key={k.label} {...k} delay={i * 0.05} />
          ))}
        </div>
        )}

        {/* Search + Filters + View toggle (matching Events page) */}
        <div className="mt-8 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2 px-4 h-11 rounded-xl border border-border bg-card shadow-soft flex-1 max-w-[400px] transition-all focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/30">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom, email, téléphone, ville..."
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="size-5 rounded-full hover:bg-secondary flex items-center justify-center">
                <X className="size-3 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="flex p-0.5 rounded-xl bg-foreground/[0.04] border border-border">
              <button
                onClick={() => setViewMode('table')}
                className={`h-10 px-3 rounded-[10px] text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`h-10 px-3 rounded-[10px] text-sm font-medium transition-all ${
                  viewMode === 'cards'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Cartes
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 rounded-xl border border-border bg-card shadow-soft px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A94A]/20 focus:border-[#D4A94A] text-foreground"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

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
              title="Actualiser"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>
        </div>

        {!isPrivacyMode && (
        <div className="mt-8 flex gap-6">
          <div className="flex-1 min-w-0 space-y-6">
            {hasNoClients ? (
              <NoClientsEmptyState onAdd={openCreate} />
            ) : hasNoResults ? (
              <NoResultsEmptyState query={searchQuery} onClear={() => setSearchQuery('')} />
            ) : (
              <>
                {viewMode === 'table' ? (
                  <ClientsTableSection
                    clients={filteredClients}
                    isLoading={isLoading}
                    onView={handleView}
                    onEdit={openEdit}
                    onDelete={openDelete}
                  />
                ) : (
                  <ClientCardsView clients={filteredClients} isLoading={isLoading} onView={handleView} />
                )}
                {viewMode === 'table' && recentClients.length > 0 && (
                  <RecentClientsSection clients={recentClients} />
                )}
                <ClientAnalytics stats={stats} totalRevenue={totalRevenue} avgValue={avgValue} activePct={activePct} totalCommandes={totalCommandes} />
              </>
            )}
          </div>
          <aside className="w-[320px] shrink-0 space-y-6">
            <div className="xl:sticky xl:top-24 space-y-6">
              <ActivitySection activities={activities} />
              <QuickStatsSection
                stats={stats}
                avgValue={avgValue}
                activePct={activePct}
                topCity={topCity}
                growthRate={stats?.growthRate ?? 0}
              />
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
      <CreateClientDialog open={isCreateOpen} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      {isEditOpen && selectedClient && (
        <EditClientDialog client={selectedClient as unknown as Client} open={true} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
      {isDeleteOpen && selectedClient && (
        <DeleteClientDialog client={selectedClient} open={true} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
    </div>
    </PrivacyModeProvider>
  );
}

/* ---------------- Empty states ---------------- */
function NoClientsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-16">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm mx-auto">
        <div className="size-20 rounded-[1.25rem] border-2 border-dashed border-border/60 bg-background flex items-center justify-center">
          <Users className="size-9 text-muted-foreground/30" strokeWidth={1.2} />
        </div>
        <div>
          <h3 className="font-display text-2xl text-foreground">Aucun client</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Votre portefeuille clients est vide. <br />
            Commencez par ajouter votre premier client.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 bg-foreground hover:opacity-90 text-background rounded-xl px-6 py-3 text-sm font-medium transition-all shadow-sm"
        >
          <Plus className="size-4" strokeWidth={1.8} />
          Ajouter un client
        </button>
      </div>
    </div>
  );
}

function NoResultsEmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-16">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm mx-auto">
        <div className="size-20 rounded-[1.25rem] border-2 border-dashed border-border/60 bg-background flex items-center justify-center">
          <Search className="size-9 text-muted-foreground/30" strokeWidth={1.2} />
        </div>
        <div>
          <h3 className="font-display text-2xl text-foreground">Aucun résultat</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Aucun client ne correspond à votre recherche <br />
            &laquo; <span className="font-medium text-foreground">{query}</span> &raquo;
          </p>
        </div>
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 bg-foreground hover:opacity-90 text-background rounded-xl px-6 py-3 text-sm font-medium transition-all shadow-sm"
        >
          <X className="size-4" strokeWidth={1.8} />
          Effacer la recherche
        </button>
      </div>
    </div>
  );
}

/* ---------------- KPI card ---------------- */
function KpiCard({ label, value, prefix, delta, trend, spark, icon: Icon, accent, delay }: {
  label: string; value: number; prefix?: string; delta: number; trend: 'up' | 'down';
  spark: number[]; icon: React.ComponentType<{ className?: string }>; accent?: boolean; delay: number;
}) {
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
          <div className="mt-3 font-display text-4xl tabular-nums">
            <span className="text-gradient-charcoal">{display}</span>
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
        <linearGradient id={`sg-${up ? 'u' : 'd'}-cl`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${up ? 'u' : 'd'}-cl)`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- Clients table section ---------------- */
function ClientsTableSection({ clients, isLoading, onView, onEdit, onDelete }: {
  clients: ClientWithStats[];
  isLoading: boolean;
  onView: (c: ClientWithStats) => void;
  onEdit: (c: ClientWithStats) => void;
  onDelete: (c: ClientWithStats) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold">Liste</div>
          <h3 className="font-display text-xl mt-0.5">Tous les clients</h3>
        </div>
        <span className="text-xs text-muted-foreground/60">{clients.length} résultat{clients.length > 1 ? 's' : ''}</span>
      </div>
      <ClientsTable data={clients} loading={isLoading} onView={onView} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

/* ---------------- Cards view (all clients) ---------------- */
function ClientCardsView({ clients, isLoading, onView }: {
  clients: ClientWithStats[];
  isLoading: boolean;
  onView: (client: ClientWithStats) => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold">Liste</div>
            <h3 className="font-display text-xl mt-0.5">Tous les clients</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-xl bg-foreground/[0.06]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-foreground/[0.06] rounded w-3/4" />
                  <div className="h-2 bg-foreground/[0.04] rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-foreground/[0.04] rounded w-full" />
                <div className="h-2 bg-foreground/[0.04] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold">Liste</div>
          <h3 className="font-display text-xl mt-0.5">Tous les clients</h3>
        </div>
        <span className="text-xs text-muted-foreground/60">{clients.length} résultat{clients.length > 1 ? 's' : ''}</span>
      </div>
      {clients.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-4 text-center">
          <div className="size-14 rounded-xl bg-foreground/[0.03] flex items-center justify-center">
            <Users className="size-6 text-muted-foreground/30" strokeWidth={1.2} />
          </div>
          <p className="text-sm text-muted-foreground">Aucun client à afficher</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c, i) => {
            const initials = c.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('');
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group relative rounded-xl border border-border bg-card p-4 overflow-hidden transition-all hover:shadow-lift cursor-pointer"
                onClick={() => onView(c)}
              >
                {Number(c.totalSpent) > 0 && (
                  <div className="pointer-events-none absolute -top-10 -right-10 size-24 rounded-full bg-gradient-gold opacity-10 blur-xl" />
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold-deep)]/20 flex items-center justify-center text-sm font-medium text-[var(--gold-foreground)]">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold leading-tight truncate">{c.name}</div>
                    {c.company && <div className="text-[10px] text-muted-foreground/60 truncate">{c.company}</div>}
                  </div>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  {c.email && (
                    <div className="flex items-center gap-1.5 text-muted-foreground/60 truncate">
                      <Mail className="size-3 shrink-0" strokeWidth={1.5} />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-1.5 text-muted-foreground/60">
                      <Phone className="size-3 shrink-0" strokeWidth={1.5} />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.city && (
                    <div className="flex items-center gap-1.5 text-muted-foreground/60">
                      <MapPin className="size-3 shrink-0" strokeWidth={1.5} />
                      <span className="truncate">{c.city}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-sm font-semibold tabular-nums">{mad(Number(c.totalSpent))}</span>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
                    <span>{c.eventsCount} événement{c.eventsCount > 1 ? 's' : ''}</span>
                    <span className="size-1 rounded-full bg-border" />
                    <span>{c.commandesCount} cmd</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Recent clients cards ---------------- */
function RecentClientsSection({ clients }: { clients: ClientWithStats[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Clients</div>
          <h3 className="font-display text-2xl mt-1">Clients récents</h3>
        </div>
      </div>
      {clients.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-4 text-center">
          <div className="size-14 rounded-xl bg-foreground/[0.03] flex items-center justify-center">
            <Users className="size-6 text-muted-foreground/30" strokeWidth={1.2} />
          </div>
          <p className="text-sm text-muted-foreground">Aucun client récent à afficher</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {clients.slice(0, 4).map((c, i) => {
            const initials = c.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('');
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group relative rounded-xl border border-border bg-card p-5 overflow-hidden transition-all hover:shadow-lift cursor-pointer"
                onClick={() => { window.location.href = `/dashboard/clients/${c.id}`; }}
              >
                {Number(c.totalSpent) > 0 && (
                  <div className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-gradient-gold opacity-10 blur-xl" />
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-11 rounded-xl bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold-deep)]/20 flex items-center justify-center text-base font-medium text-[var(--gold-foreground)]">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold leading-tight truncate">{c.name}</div>
                    {c.company && <div className="text-[11px] text-muted-foreground/60 truncate">{c.company}</div>}
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  {c.email && (
                    <div className="flex items-center gap-2 text-muted-foreground/70 truncate">
                      <Mail className="size-3.5 shrink-0 text-muted-foreground/30" strokeWidth={1.5} />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground/70">
                      <Phone className="size-3.5 shrink-0 text-muted-foreground/30" strokeWidth={1.5} />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.city && (
                    <div className="flex items-center gap-2 text-muted-foreground/70">
                      <MapPin className="size-3.5 shrink-0 text-muted-foreground/30" strokeWidth={1.5} />
                      <span className="truncate">{c.city}</span>
                    </div>
                  )}
                  {c.lastOrderAt && (
                    <div className="flex items-center gap-2 text-muted-foreground/70">
                      <Clock className="size-3.5 shrink-0 text-muted-foreground/30" strokeWidth={1.5} />
                      <span>{new Date(c.lastOrderAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-sm font-semibold tabular-nums">{mad(Number(c.totalSpent))}</span>
                  <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground/50">
                    <span>{c.eventsCount} évènement{c.eventsCount > 1 ? 's' : ''}</span>
                    <span className="size-1 rounded-full bg-border" />
                    <span>{c.commandesCount} cmd</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Analytics ---------------- */
function ClientAnalytics({ stats, totalRevenue, avgValue, activePct, totalCommandes }: {
  stats: ClientStats | null;
  totalRevenue: number;
  avgValue: number;
  activePct: number;
  totalCommandes: number;
}) {
  const growth = stats?.growthRate ?? 0;
  const topClient = stats?.topSpendingClient;

  const hasFinancialData = totalRevenue > 0 || totalCommandes > 0 || (stats?.totalClients ?? 0) > 0;

  const metrics = [
    { label: 'Revenu Total', value: totalRevenue, unit: 'MAD' as const },
    { label: 'Valeur Moyenne', value: Math.round(avgValue), unit: 'MAD' as const },
    { label: 'Commandes', value: totalCommandes, unit: '' as const },
    { label: 'Clients Actifs', value: activePct, unit: '%' as const },
    { label: 'Croissance', value: growth, unit: '%' as const },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Analytics</div>
          <h3 className="font-display text-xl mt-0.5">Finances</h3>
        </div>
      </div>
      {!hasFinancialData ? (
        <div className="py-12 flex flex-col items-center gap-4 text-center">
          <div className="size-16 rounded-full bg-foreground/[0.03] flex items-center justify-center">
            <Wallet className="size-8 text-muted-foreground/30" strokeWidth={1.2} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Aucune donnée financière disponible</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-[240px]">
              Créez votre première commande pour afficher les statistiques.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
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
                  <span className="text-gradient-charcoal">
                    {c.unit === 'MAD' ? mad(Math.round(c.value)) : c.unit === '%' ? `${Math.round(c.value)}%` : Math.round(c.value).toLocaleString('fr-FR')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 pt-3 border-t border-border/50">
            {topClient && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Crown className="size-3.5 text-[var(--gold-deep)]" strokeWidth={1.5} />
                <span>Meilleur client : <span className="font-medium text-foreground">{topClient.name}</span></span>
                <span className="tabular-nums text-[var(--gold-deep)]">{mad(topClient.totalSpent)}</span>
              </div>
            )}
            {stats?.topCity && stats.topCity !== '—' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="size-3.5 text-muted-foreground/50" strokeWidth={1.5} />
                <span>Ville principale : <span className="font-medium text-foreground">{stats.topCity}</span></span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Right sidebar: activity timeline ---------------- */
function ActivitySection({ activities }: { activities: ActivityItem[] }) {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'client_created': return UserPlus;
      case 'client_updated': return Pencil;
      case 'commande_created': return ShoppingCart;
      case 'event_assigned': return Calendar;
      case 'payment_received': return CreditCard;
    }
  };
  const getColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'client_created': return 'text-blue-600 bg-blue-50';
      case 'client_updated': return 'text-sky-600 bg-sky-50';
      case 'commande_created': return 'text-purple-600 bg-purple-50';
      case 'event_assigned': return 'text-amber-600 bg-amber-50';
      case 'payment_received': return 'text-emerald-600 bg-emerald-50';
    }
  };
  const formatTime = (date: Date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Activité</div>
          <h3 className="font-display text-xl mt-1">Fil d&apos;activité</h3>
        </div>
        <span className="text-xs text-muted-foreground">{activities.length}</span>
      </div>
      {activities.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-10 flex flex-col items-center gap-3 text-center"
        >
          <div className="size-14 rounded-full bg-foreground/[0.03] flex items-center justify-center">
            <Clock className="size-7 text-muted-foreground/30" strokeWidth={1.2} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Aucune activité récente</p>
            <p className="text-xs text-muted-foreground/50 mt-1 max-w-[200px]">
              Les interactions clients apparaîtront ici au fur et à mesure.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/60" />
          <div className="space-y-0">
            {activities.map((a, i) => {
              const Icon = getIcon(a.type);
              const color = getColor(a.type);
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative flex items-start gap-3 pb-4 last:pb-0"
                >
                  <div className={`relative z-10 size-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="size-3.5" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="text-xs leading-snug text-foreground/80">{a.description}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground/50">{a.clientName}</span>
                      <span className="size-0.5 rounded-full bg-muted-foreground/30" />
                      <span className="text-[10px] text-muted-foreground/40">{formatTime(a.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Quick stats ---------------- */
function QuickStatsSection({ stats, avgValue, activePct, topCity, growthRate }: {
  stats: ClientStats | null;
  avgValue: number;
  activePct: number;
  topCity: string;
  growthRate: number;
}) {
  const hasData = (stats?.totalClients ?? 0) > 0;
  const hasFinancialData = avgValue > 0;

  const quickStats = [
    { label: 'Dépense moyenne', value: hasFinancialData ? avgValue : 0, isMoney: true as const, show: hasFinancialData },
    { label: 'Clients actifs', value: hasData ? activePct : 0, suffix: '%' as const, show: hasData },
    { label: 'Ville principale', value: hasData && topCity && topCity !== '—' ? topCity : '—', isString: true as const, show: hasData },
    { label: 'Taux de croissance', value: hasData ? growthRate : 0, suffix: '%' as const, show: hasData },
  ];

  const visibleStats = quickStats.filter(s => s.show);
  const hasAnyData = visibleStats.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Indicateurs</div>
        <h3 className="font-display text-xl mt-1">Stats rapides</h3>
      </div>
      {!hasAnyData ? (
        <div className="py-8 flex flex-col items-center gap-3 text-center">
          <div className="size-12 rounded-full bg-foreground/[0.03] flex items-center justify-center">
            <TrendingUp className="size-6 text-muted-foreground/30" strokeWidth={1.2} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Aucune statistique disponible</p>
            <p className="text-xs text-muted-foreground/50 mt-0.5 max-w-[180px]">
              Les indicateurs apparaîtront avec les premières commandes.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {visibleStats.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium tabular-nums">
                    {'isMoney' in s && s.isMoney ? mad(Math.round(s.value as number)) :
                     'suffix' in s ? `${Math.round(s.value as number)}${s.suffix}` :
                     s.value}
                  </span>
                </div>
                {'isMoney' in s && s.isMoney && stats && (
                  <div className="h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((s.value as number) / Math.max(stats.totalRevenue || 1, 1) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                      className="h-full bg-gradient-gold"
                    />
                  </div>
                )}
                {'suffix' in s && s.suffix === '%' && (
                  <div className="h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(s.value as number, 100)}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                      className="h-full bg-gradient-gold"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              {stats ? `${stats.totalClients} client${stats.totalClients > 1 ? 's' : ''} au total` : 'Chargement...'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
