'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { KpiCard } from '@/shared/components/kpi-card';
import {
  Search, X, Plus, TrendingUp,
  Calendar, CheckCircle2, Wallet, Receipt, ArrowUpRight,
  ShoppingBag, Users, Sparkles, SlidersHorizontal, RefreshCw, Tag,
} from 'lucide-react';
import { computeKpi } from '@/features/dashboard/lib/kpi-engine';
import { useCommandes } from '@/features/commandes/hooks/use-commandes';
import { CommandesTable } from '@/features/commandes/components/commandes-table';
import { MobileOrderCards } from '@/features/commandes/components/mobile-order-cards';
import { CommandesGrid } from '@/features/commandes/components/commandes-grid';
import { CommandesCalendar } from '@/features/commandes/components/commandes-calendar';
import { MiniCalendar } from '@/features/dashboard/components/MiniCalendar';
import { ViewSwitcher, type ViewMode } from '@/features/commandes/components/view-switcher';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { deleteCommande } from '@/features/commandes/actions/delete-commande';
import { notify } from '@/lib/notify';
import { COMMANDE } from '@/lib/notify/messages';
import { COMMANDE_STATUS_LABELS, COMMANDE_STATUS_STYLES } from '@/features/commandes/constants';
import type { Commande } from '@/features/commandes/types';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Mariage',
  CORPORATE: 'Corporate',
  BIRTHDAY: 'Anniversaire',
  ANNIVERSARY: 'Anniversaire de mariage',
  HOLIDAY: 'Fête',
  OTHER: 'Autre',
};

const ALL_STATUS_KEYS = ['DRAFT', 'QUOTED', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'];
const EVENT_TYPE_CHIPS = ['WEDDING', 'CORPORATE', 'BIRTHDAY', 'ANNIVERSARY', 'HOLIDAY'];

export default function CommandesPage() {
  const router = useRouter();
  const {
    commandes, isLoading, pagination,
    handleSearch, handlePageChange, handleLimitChange, refresh,
    dbStats,
  } = useCommandes();
  const [deleteTarget, setDeleteTarget] = useState<Commande | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [showEventTypeFilters, setShowEventTypeFilters] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  useEffect(() => {
    const saved = localStorage.getItem('commandes-view');
    if (saved === 'table' || saved === 'grid' || saved === 'calendar') {
      setViewMode(saved);
    } else if (window.matchMedia('(max-width: 1023px)').matches) {
      setViewMode('grid');
    }
  }, []);

  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('commandes-view', mode);
  }, []);

  const searchMounted = useRef(false);
  useEffect(() => {
    if (!searchMounted.current) {
      searchMounted.current = true;
      return;
    }
    const timer = setTimeout(() => handleSearch(localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch, handleSearch]);

  const handleView = useCallback((cmd: Commande) => {
    router.push(`/dashboard/commandes/${cmd.id}`);
  }, [router]);

  const handleEdit = useCallback((cmd: Commande) => {
    router.push(`/dashboard/commandes/${cmd.id}/edit`);
  }, [router]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const result = await deleteCommande(deleteTarget.id);
    setDeleteLoading(false);
    setDeleteTarget(null);
      if (result.success) {
        notify.success(COMMANDE.DELETE.SUCCESS(deleteTarget.number));
        refresh();
      } else {
        notify.error(result.error ?? COMMANDE.DELETE.ERROR);
      }
  }, [deleteTarget, refresh]);

  const toggleStatus = (key: string) => {
    setSelectedStatuses(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const stats = useMemo(() => {
    const c = dbStats?.currentMonth;
    const totalKpi = computeKpi(dbStats?.perfTotal ?? []);
    const activeKpi = computeKpi(dbStats?.perfActive ?? []);
    const upcomingKpi = computeKpi(dbStats?.perfUpcoming ?? []);
    const revenueKpi = computeKpi(dbStats?.perfRevenue ?? []);
    const remainingKpi = computeKpi(dbStats?.perfRemaining ?? []);
    const conversionKpi = computeKpi(dbStats?.perfConversion ?? []);

    return [
      { label: 'Total commandes', value: c?.total ?? 0, icon: ShoppingBag, accent: true, ...totalKpi },
      { label: 'Commandes actives', value: c?.active ?? 0, icon: CheckCircle2, ...activeKpi },
      { label: 'Événements à venir', value: c?.upcomingCount ?? 0, icon: Calendar, ...upcomingKpi },
      { label: "Chiffre d'affaires", value: c?.revenue ?? 0, prefix: 'MAD', icon: Wallet, accent: true, ...revenueKpi },
      { label: 'Reste à encaisser', value: c?.remaining ?? 0, prefix: 'MAD', icon: Receipt, ...remainingKpi },
      { label: 'Taux de conversion', value: c?.conversionRate ?? 0, icon: TrendingUp, ...conversionKpi },
    ];
  }, [dbStats]);

  const filteredByEventType = useMemo(() => {
    let result = commandes;
    if (eventTypeFilter) {
      result = result.filter(c => c.eventType === eventTypeFilter);
    }
    if (selectedStatuses.size > 0) {
      result = result.filter(c => selectedStatuses.has(c.status));
    }
    return result;
  }, [commandes, eventTypeFilter, selectedStatuses]);

  const upcomingEvents = useMemo(() => {
    return commandes
      .filter(c => c.eventDate && new Date(c.eventDate) >= new Date() && c.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.eventDate!).getTime() - new Date(b.eventDate!).getTime())
      .slice(0, 5);
  }, [commandes]);

  const pendingPayments = useMemo(() => {
    return commandes
      .filter(c => Number(c.remainingAmount) > 0 && c.status !== 'CANCELLED' && c.status !== 'DELIVERED')
      .sort((a, b) => Number(b.remainingAmount) - Number(a.remainingAmount))
      .slice(0, 5);
  }, [commandes]);

  const toggleEventType = (type: string) => {
    setEventTypeFilter(prev => prev === type ? null : type);
  };

  const c = dbStats?.currentMonth;
  const subtitleParts = [
    (c?.active ?? 0) > 0 && `${c?.active} commande${(c?.active ?? 0) > 1 ? 's' : ''} active${(c?.active ?? 0) > 1 ? 's' : ''}`,
    (c?.revenue ?? 0) > 0 && `${mad(c?.revenue ?? 0)} de chiffre d'affaires`,
    (c?.upcomingCount ?? 0) > 0 && `${c?.upcomingCount} événement${(c?.upcomingCount ?? 0) > 1 ? 's' : ''} à venir`,
  ].filter(Boolean);

  const activeFilterCount = selectedStatuses.size + (eventTypeFilter ? 1 : 0);

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

        {/* ═══ HERO SECTION ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--gold-soft)]/40 bg-[var(--gold-soft)]/10 text-[11px] font-medium text-[var(--gold-deep)] tracking-wide mb-4">
            <Sparkles className="size-3" strokeWidth={2} />
            Centre opérationnel
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05]">
                Commandes
              </h1>
              {subtitleParts.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1.5">
                  {subtitleParts.join(' · ')}
                </p>
              )}
            </div>
            <Link
              href="/dashboard/commandes/new"
              className="inline-flex items-center justify-center gap-2 bg-foreground hover:opacity-90 text-background rounded-xl px-5 py-2.5 text-sm font-medium transition-all shadow-sm shrink-0 w-full sm:w-auto"
            >
              <Plus className="size-4" strokeWidth={1.8} />
              Nouvelle commande
            </Link>
          </div>
        </motion.div>

        {/* ═══ KPI CARDS ═══ */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
          {stats.map((k, i) => (
            <KpiCard key={k.label} {...k} delay={i * 0.05} />
          ))}
        </div>

        {/* ═══ SEARCH + FILTER CHIPS ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
          className="mt-8 mb-6 space-y-3"
        >
          {/* Search row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 px-4 h-11 rounded-xl border border-border bg-card shadow-soft w-full sm:flex-1 transition-all focus-within:border-[var(--gold-deep)] focus-within:ring-1 focus-within:ring-[var(--gold-deep)]/20">
              <Search size={18} strokeWidth={1.8} className="text-muted-foreground shrink-0" />
              <input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Référence, client, événement…"
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
              />
              {localSearch && (
                <button onClick={() => { setLocalSearch(''); handleSearch(''); }} className="size-5 rounded-full hover:bg-secondary flex items-center justify-center">
                  <X className="size-3 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="flex flex-row flex-nowrap items-center justify-between w-full gap-1.5 sm:gap-2 sm:ml-auto md:justify-end md:w-auto">
              <div className="sm:order-last inline-flex">
                <ViewSwitcher value={viewMode} onChange={handleViewChange} />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 w-auto">
                <button
                  onClick={() => setShowEventTypeFilters(prev => !prev)}
                  className={`flex-none h-11 px-3 sm:px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                    showEventTypeFilters || activeFilterCount > 0
                      ? 'border-[var(--gold-deep)] bg-[var(--gold-soft)]/10 text-[var(--gold-deep)]'
                      : 'border-border bg-card shadow-soft text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                  }`}
                >
                  <SlidersHorizontal className="size-[18px]" strokeWidth={1.8} />
                  <span className="inline">Filtres</span>
                  {activeFilterCount > 0 && (
                    <span className="size-5 rounded-full bg-[var(--gold-deep)] text-white text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={refresh}
                  className="size-11 min-w-[44px] min-h-[44px] rounded-xl border border-border bg-card shadow-soft text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all flex items-center justify-center"
                  title="Actualiser"
                >
                  <RefreshCw className={`size-[18px] ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          </div>

          {/* Status filter chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatuses(new Set())}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                selectedStatuses.size === 0
                  ? 'border-[var(--gold-deep)] bg-[var(--gold-soft)]/20 text-[var(--gold-deep)]'
                  : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground bg-background'
              }`}
            >
              Tous
            </button>
            {ALL_STATUS_KEYS.map(key => (
              <button
                key={key}
                onClick={() => toggleStatus(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  selectedStatuses.has(key)
                    ? 'border-[var(--gold-deep)] bg-[var(--gold-soft)]/20 text-[var(--gold-deep)]'
                    : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground bg-background'
                }`}
              >
                {COMMANDE_STATUS_LABELS[key]}
              </button>
            ))}
          </div>

          {/* Event type filters (togglable) */}
          <AnimatePresence>
            {showEventTypeFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-1">
                  {EVENT_TYPE_CHIPS.map(key => (
                    <button
                      key={key}
                      onClick={() => toggleEventType(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        eventTypeFilter === key
                          ? 'border-[var(--gold-deep)] bg-[var(--gold-soft)]/20 text-[var(--gold-deep)]'
                          : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground bg-background'
                      }`}
                    >
                      {EVENT_TYPE_LABELS[key]}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">

          {/* PRIMARY COLUMN */}
          <div className={viewMode === 'calendar' ? 'flex-1 min-w-0' : 'flex-1 xl:w-[73%] min-w-0'}>
 
            {/* TABLE VIEW */}
            {viewMode === 'table' && (
              <>
                {/* Desktop table (md+) */}
                <div className="hidden md:block">
                  <motion.div
                    key="table-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                    className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden min-w-0 w-full"
                  >
                    <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold">Liste</div>
                        <h3 className="font-display text-xl mt-0.5">Toutes les commandes</h3>
                      </div>
                      <span className="text-xs text-muted-foreground/60">
                        {isLoading ? '…' : `${filteredByEventType.length} résultat${filteredByEventType.length > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <CommandesTable
                      data={filteredByEventType}
                      loading={isLoading}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={setDeleteTarget}
                    />
                    <div className="px-4 sm:px-6 pb-5">
                      <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        limit={pagination.limit}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChange}
                        itemLabel="commande"
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Mobile cards (<md) */}
                <div className="md:hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold">Liste</div>
                      <h3 className="font-display text-xl mt-0.5">Toutes les commandes</h3>
                    </div>
                    <span className="text-xs text-muted-foreground/60">
                      {isLoading ? '…' : `${filteredByEventType.length} résultat${filteredByEventType.length > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <MobileOrderCards
                    data={filteredByEventType}
                    loading={isLoading}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                  />
                  <div className="mt-4">
                    <Pagination
                      page={pagination.page}
                      totalPages={pagination.totalPages}
                      total={pagination.total}
                      limit={pagination.limit}
                      onPageChange={handlePageChange}
                      onLimitChange={handleLimitChange}
                      itemLabel="commande"
                    />
                  </div>
                </div>
              </>
            )}

            {/* GRID VIEW */}
            {viewMode === 'grid' && (
              <motion.div
                key="grid-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
                className="min-w-0 w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold">Vue grille</div>
                    <h3 className="font-display text-xl mt-0.5">Aperçu des commandes</h3>
                  </div>
                  <span className="text-xs text-muted-foreground/60">
                    {isLoading ? '…' : `${filteredByEventType.length} commande${filteredByEventType.length > 1 ? 's' : ''}`}
                  </span>
                </div>
                <CommandesGrid
                  data={filteredByEventType}
                  loading={isLoading}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                />
              </motion.div>
            )}

            {/* CALENDAR VIEW */}
            {viewMode === 'calendar' && (
              <>
                <div className="hidden md:block">
                  <CommandesCalendar
                    data={filteredByEventType}
                    loading={isLoading}
                    onView={handleView}
                    onEdit={handleEdit}
                  />
                </div>
                <div className="md:hidden">
                  <MiniCalendar />
                </div>
              </>
            )}
          </div>

          {/* ═══ SIDEBAR (hidden in calendar view) ═══ */}
          {viewMode !== 'calendar' && (
            <div className="xl:w-[27%] xl:min-w-[300px] space-y-5">

              {/* Upcoming Events */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                className="rounded-2xl border border-border bg-card shadow-soft p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="size-4 text-[var(--gold-deep)]" strokeWidth={1.8} />
                  <h4 className="font-display text-base">Événements à venir</h4>
                </div>
                {upcomingEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 py-3 text-center">Aucun événement à venir</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((cmd) => (
                      <button
                        key={cmd.id}
                        onClick={() => handleView(cmd)}
                        className="w-full flex items-start gap-3 group hover:bg-muted/40 rounded-xl p-2.5 -mx-2.5 transition-colors text-left"
                      >
                        <div className="size-9 rounded-lg bg-[var(--gold-soft)]/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="size-4 text-[var(--gold-deep)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate group-hover:text-[var(--gold-deep)] transition-colors">
                            {cmd.eventName || cmd.clientName || cmd.number}
                          </div>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[11px] text-muted-foreground/60">
                            {cmd.eventDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3" strokeWidth={1.5} />
                                {new Date(cmd.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                            {cmd.eventType && (
                              <span className="flex items-center gap-1">
                                <Tag className="size-3" strokeWidth={1.5} />
                                {EVENT_TYPE_LABELS[cmd.eventType] || cmd.eventType}
                              </span>
                            )}
                            {cmd.guestCount && (
                              <span className="flex items-center gap-1">
                                <Users className="size-3" strokeWidth={1.5} />
                                {cmd.guestCount} invités
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground/40 mt-0.5">
                            {cmd.clientName || 'Client inconnu'}
                          </div>
                        </div>
                        <ArrowUpRight className="size-3.5 text-muted-foreground/30 group-hover:text-[var(--gold-deep)] transition-colors shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Pending Payments */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                className="rounded-2xl border border-border bg-card shadow-soft p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="size-4 text-[var(--gold-deep)]" strokeWidth={1.8} />
                  <h4 className="font-display text-base">Paiements en attente</h4>
                </div>
                {pendingPayments.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 py-3 text-center">Tout est en ordre ✓</p>
                ) : (
                  <div className="space-y-3">
                    {pendingPayments.map((cmd) => {
                      const total = Number(cmd.totalAmount);
                      const paid = Number(cmd.paidAmount);
                      const remainingAmt = Number(cmd.remainingAmount);
                      const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => handleView(cmd)}
                          className="w-full group hover:bg-muted/40 rounded-xl p-2.5 -mx-2.5 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-[var(--gold-soft)]/20 flex items-center justify-center shrink-0">
                              <Receipt className="size-4 text-[var(--gold-deep)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{cmd.number}</div>
                              <div className="text-[11px] text-muted-foreground/60 mt-0.5">
                                Restant : <span className="font-semibold text-[var(--gold-deep)]">{mad(remainingAmt)}</span>
                                <span className="text-muted-foreground/30 mx-1">·</span>
                                Payé : {mad(paid)}
                              </div>
                            </div>
                            <div className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${COMMANDE_STATUS_STYLES[cmd.status] || ''}`}>
                              {COMMANDE_STATUS_LABELS[cmd.status] || cmd.status}
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--gold-soft)]/30 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--gold-deep)] transition-all"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>

            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 sm:mt-16 mb-4 sm:mb-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/60 text-center sm:text-left px-2">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            <span>Tous les services opérationnels</span>
          </div>
          <div>© TUR — Suite traiteur premium</div>
        </footer>
      </div>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteConfirmDialog
          open={true}
          onOpenChange={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
          title="Supprimer la commande"
          description={
            <>
              Êtes-vous sûr de vouloir supprimer la commande{' '}
              <span className="font-semibold text-foreground">{deleteTarget.number}</span> ?
            </>
          }
        />
      )}
    </div>
  );
}
