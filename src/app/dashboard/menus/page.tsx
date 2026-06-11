'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Download, Search, LayoutGrid, List, Eye, Pencil, Copy,
  Archive, X, Sparkles, TrendingUp, Star, Clock, Clock3,
  Settings2, CheckCircle2, ArrowUpRight,
  Wine, Cake, Flower2, Users, Box,
  Crown, Trash2, BarChart3, Tag, Utensils,
  Heart, Briefcase, Coffee, Wand2, Package, Building, Martini,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { useMenus } from '@/features/menus/hooks/use-menus';
import { useMenuForm } from '@/features/menus/hooks/use-menu-form';
import { MenusTable } from '@/features/menus/components/menus-table';
import { CreateMenuDialog } from '@/features/menus/components/create-menu-dialog';
import { EditMenuDialog } from '@/features/menus/components/edit-menu-dialog';
import { DeleteMenuDialog } from '@/features/menus/components/delete-menu-dialog';
import type { Menu, MenuCategory } from '@/features/menus/types';
import { CATEGORY_LABELS, CATEGORY_BADGE_COLORS } from '@/features/menus/constants';
import { formatCurrency } from '@/lib/utils';

const dh = (n: number) => formatCurrency(n);

function useCounter(target: number, dur = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

/* ---------------- Category metadata ---------------- */

const CAT_ICON: Record<string, any> = {
  total: Package,
  active: CheckCircle2,
  WEDDING: Heart,
  CORPORATE: Briefcase,
};

const CAT_ACCENT: Record<string, string> = {
  total: 'from-stone-50 to-stone-100',
  active: 'from-[var(--gold-soft)] to-amber-50',
  WEDDING: 'from-rose-50 to-pink-50',
  CORPORATE: 'from-blue-50 to-indigo-50',
};

const KPI_CARDS = [
  { key: 'total', label: 'Total Menus' },
  { key: 'active', label: 'Menus Actifs' },
  { key: 'WEDDING', label: 'Mariage' },
  { key: 'CORPORATE', label: 'Entreprise' },
] as const;

const CAT_CHIPS = [
  { key: 'ALL', label: 'Toutes catégories' },
  ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label })),
];

const PACK_COVER: Record<string, string> = {
  WEDDING: 'from-pink-100 to-yellow-50',
  CORPORATE: 'from-slate-100 to-gray-50',
  BUFFET: 'from-amber-50 to-orange-50',
  COCKTAIL: 'from-emerald-100 to-cyan-50',
  BRUNCH: 'from-yellow-50 to-amber-50',
  DESSERT: 'from-pink-100 to-rose-50',
  CUSTOM: 'from-violet-100 to-indigo-50',
};

const ITEM_EMOJI: Record<string, string> = {
  FOOD: '🍲', DRINKS: '🍹', DESSERTS: '🍬',
  DECORATION: '💐', STAFF: '🎩',
  ENTERTAINMENT: '🎧', EXTRAS: '🎆',
};

type ViewMode = 'grid' | 'table';
type StatusFilter = 'all' | 'active' | 'inactive';

export default function MenusPage() {
  const { menus, isLoading, error, pagination, handleSearch, handlePageChange, refresh } = useMenus();
  const {
    isCreateOpen, isEditOpen, isDeleteOpen, selectedMenu,
    openCreate, openEdit, openDelete, closeAll,
  } = useMenuForm();

  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [view, setView] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menus.filter((m) => {
      if (catFilter !== 'ALL' && m.category !== catFilter) return false;
      if (statusFilter === 'active' && !m.isActive) return false;
      if (statusFilter === 'inactive' && m.isActive) return false;
      if (!q) return true;
      return [m.name, m.category, m.description || ''].some((s) => s.toLowerCase().includes(q));
    });
  }, [menus, query, catFilter, statusFilter]);

  const kpis = useMemo(() => {
    const total = menus.length;
    const active = menus.filter((m) => m.isActive).length;
    const byCat = (c: MenuCategory) => menus.filter((m) => m.category === c).length;
    return { total, active, WEDDING: byCat('WEDDING'), CORPORATE: byCat('CORPORATE') };
  }, [menus]);

  const mostComplete = useMemo(() =>
    [...menus].sort((a, b) => (b.menuItems?.length ?? 0) - (a.menuItems?.length ?? 0))[0],
  [menus]);

  const handleView = useCallback((menu: Menu) => { window.location.href = `/dashboard/menus/${menu.id}`; }, []);
  const handleEdit = useCallback((menu: Menu) => openEdit(menu), [openEdit]);
  const handleDelete = useCallback((menu: Menu) => openDelete(menu), [openDelete]);

  const isSearching = query.length > 0;
  const hasNoResults = !isLoading && isSearching && filtered.length === 0;
  const hasNoItems = !isLoading && !isSearching && menus.length === 0;

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">

        {/* Hero */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Badge variant="outline" className="gap-1 border-[var(--gold)]/40 bg-[var(--gold-soft)]/40 font-normal text-xs px-2 py-0">
                <Sparkles className="size-3 text-[var(--gold-deep)]" /> Catalogue Premium
              </Badge>
              <span className="text-muted-foreground/40 mx-1">•</span>
              <span>{pagination.total} au total</span>
            </div>
            <h1 className="font-display text-5xl lg:text-6xl text-gradient-charcoal leading-[1.05]">
              Menus
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Gérez l&apos;ensemble de vos formules et menus proposés à vos clients pour leurs événements.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-10 rounded-lg border-border bg-background/60 backdrop-blur gap-2" onClick={() => setShowFilters((s) => !s)}>
              <Settings2 className="size-4" /> Filtres
            </Button>
            <Button variant="outline" size="sm" className="h-10 rounded-lg border-border bg-background/60 backdrop-blur gap-2" onClick={() => {
              const csv = menus.map(m => `${m.name},${m.category},${Number(m.pricePerPerson)},${m.isActive ? 'Actif' : 'Masqué'},${new Date(m.updatedAt).toISOString()}`).join('\n');
              const blob = new Blob(['Nom,Catégorie,Prix,Statut,Mise à jour\n' + csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'menus.csv'; a.click();
              URL.revokeObjectURL(url);
            }}>
              <Download className="size-4" /> Export
            </Button>
            <Button onClick={() => { openCreate(); }} className="h-10 rounded-lg bg-gradient-charcoal text-white shadow-lift hover:opacity-95 gap-2 px-4">
              <Plus className="size-4" /> Nouveau Menu
            </Button>
          </div>
        </div>

        {/* KPI Section — 4 stats + 1 featured card */}
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {KPI_CARDS.map((c, i) => (
            <KpiCard
              key={c.key}
              label={c.label}
              value={kpis[c.key as keyof typeof kpis] as number}
              icon={CAT_ICON[c.key]}
              accent={CAT_ACCENT[c.key] || 'from-stone-50 to-stone-100'}
              gold={c.key === 'active'}
              delay={i * 0.06}
            />
          ))}
          {mostComplete && (
            <MostCompleteCard menu={mostComplete} onView={() => handleView(mostComplete)} />
          )}
        </div>

        {/* Toolbar */}
        <div className="mt-8 rounded-2xl border border-border/60 bg-card/80 p-3 shadow-soft backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un menu — nom, catégorie, description…"
                className="h-11 rounded-xl border-transparent bg-[var(--surface-soft)] pl-11 text-sm focus-visible:bg-background"
              />
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background p-1">
              {(['all', 'active', 'inactive'] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition', statusFilter === s ? 'bg-gradient-charcoal text-white' : 'text-muted-foreground hover:text-foreground')}
                >{s === 'all' ? 'Tous' : s === 'active' ? 'Actif' : 'Inactif'}</button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background p-1">
              {(['grid', 'table'] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition', view === v ? 'bg-gradient-charcoal text-white' : 'text-muted-foreground hover:text-foreground')}
                >{v === 'grid' ? <LayoutGrid className="size-3.5" /> : <List className="size-3.5" />}{v === 'grid' ? 'Grid' : 'Table'}</button>
              ))}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                  {CAT_CHIPS.map((c) => {
                    const catColor = c.key !== 'ALL' ? CATEGORY_BADGE_COLORS[c.key as keyof typeof CATEGORY_BADGE_COLORS] : null;
                    return (
                      <button key={c.key} onClick={() => setCatFilter(c.key)}
                        className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition', catFilter === c.key ? catColor || 'border-charcoal bg-gradient-charcoal text-white' : 'border-border/60 bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground')}
                      >{c.label}</button>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <div className="ml-auto flex items-center gap-2">
                    <span>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => { setCatFilter('ALL'); setStatusFilter('all'); setQuery(''); }}>
                      <X className="size-3" /> Réinitialiser
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}

        {/* Content + sidebar */}
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {hasNoItems ? (
              <EmptyState onCreate={() => openCreate()} />
            ) : hasNoResults ? (
              <NoResultsEmpty query={query} onClear={() => setQuery('')} />
            ) : view === 'grid' ? (
              <GridView menus={filtered} loading={isLoading} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
            ) : (
              <div className="rounded-2xl border border-border bg-card shadow-soft">
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold">Liste</div>
                    <h3 className="font-display text-xl mt-0.5">Tous les menus</h3>
                  </div>
                  <span className="text-xs text-muted-foreground/60">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
                </div>
                <MenusTable data={filtered} loading={isLoading} onEdit={handleEdit} onDelete={handleDelete} pagination={pagination} handlePageChange={handlePageChange} />
              </div>
            )}
          </div>

          <Sidebar menus={menus} onView={handleView} />
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
      <CreateMenuDialog open={isCreateOpen} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      {isEditOpen && selectedMenu && (
        <EditMenuDialog menu={selectedMenu} open={true} onClose={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
      {isDeleteOpen && selectedMenu && (
        <DeleteMenuDialog menu={selectedMenu} open={true} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
    </div>
  );
}

/* ---------------- KPI ---------------- */

function KpiCard({ label, value, icon: Icon, accent, gold, delay }: { label: string; value: number; icon: any; accent: string; gold?: boolean; delay?: number }) {
  const v = useCounter(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      whileHover={{ y: -3 }}
      className={cn('relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition-all hover:shadow-lift', gold && 'ring-1 ring-[var(--gold)]/40')}
    >
      <div className={cn('absolute inset-0 -z-0 bg-gradient-to-br opacity-60', accent)} />
      <div className="relative flex items-start justify-between mb-5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        <div className={cn('grid h-10 w-10 place-items-center rounded-xl', gold ? 'bg-gradient-gold text-[var(--gold-foreground)]' : 'bg-background/80 backdrop-blur')}>
          <Icon className={cn('size-4', gold ? 'text-[var(--gold-foreground)]' : 'text-charcoal')} />
        </div>
        {gold && <Crown className="absolute top-0 right-0 size-3.5 text-[var(--gold-deep)]" />}
      </div>
      <div className="relative font-display text-4xl leading-none tracking-tight text-charcoal tabular-nums">{v}</div>
    </motion.div>
  );
}

/* ---------------- Most Complete Card ---------------- */

function MostCompleteCard({ menu, onView }: { menu: Menu; onView: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
      className="relative col-span-2 overflow-hidden rounded-2xl border border-[var(--gold)]/50 bg-gradient-to-br from-[var(--gold-soft)]/60 via-amber-50/40 to-card p-6 shadow-[0_8px_30px_-12px_rgba(180,140,40,0.2)]"
    >
      <div className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-gradient-gold opacity-25 blur-2xl" />
      <div className="relative flex flex-col h-full justify-between gap-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gold-deep)]">
              <Star className="size-3" /> Le plus complet
            </div>
            <div className="mt-3 font-display text-2xl leading-tight text-charcoal">{menu.name}</div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Utensils className="size-3.5 text-[var(--gold-deep)]" />
                {menu.menuItems?.length ?? 0} articles
              </span>
              <span>{dh(Number(menu.pricePerPerson))} / pers.</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium border', CATEGORY_BADGE_COLORS[menu.category as keyof typeof CATEGORY_BADGE_COLORS] || 'bg-foreground/[0.05] text-muted-foreground')}>
                {CATEGORY_LABELS[menu.category] || menu.category}
              </span>
            </div>
          </div>
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-gold shadow-md">
            <Crown className="size-7 text-[var(--gold-foreground)]" />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-[var(--gold)]/20">
          <button onClick={onView}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--gold-deep)] text-white px-4 py-2 text-xs font-medium hover:brightness-110 transition-all shadow-sm"
          >
            <Eye className="size-3.5" /> Voir le menu
          </button>
          <span className="text-[10px] text-muted-foreground/60">
            {menu.minPersons}{menu.maxPersons ? `–${menu.maxPersons}` : '+'} personnes
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- Grid view ---------------- */

function GridView({ menus, loading, onView, onEdit, onDelete }: {
  menus: Menu[]; loading: boolean;
  onView: (m: Menu) => void;
  onEdit: (m: Menu) => void;
  onDelete: (m: Menu) => void;
}) {
  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mx-auto w-full max-w-[420px] rounded-3xl border border-stone-200/80 bg-white shadow-[0_4px_24px_-8px_rgba(50,40,20,0.08)] overflow-hidden animate-pulse">
            <div className="h-[170px] bg-foreground/[0.04]" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-foreground/[0.06] rounded w-3/4" />
              <div className="h-3 bg-foreground/[0.04] rounded w-full" />
              <div className="h-3 bg-foreground/[0.04] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.035 } } }}
      className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
    >
      {menus.map((m) => (
        <PackCard key={m.id} menu={m} onView={() => onView(m)} onEdit={() => onEdit(m)} onDelete={() => onDelete(m)} />
      ))}
    </motion.div>
  );
}

/* ---------------- Pack Card ---------------- */

function PackCard({ menu, onView, onEdit, onDelete }: {
  menu: Menu;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cover = PACK_COVER[menu.category] || PACK_COVER.CUSTOM;
  const meta = CATEGORY_LABELS[menu.category] || menu.category;
  const itemsCount = menu.menuItems?.length ?? 0;
  const preview = (menu.menuItems || []).slice(0, 4);
  const more = itemsCount - preview.length;

  return (
    <motion.article
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -6 }}
      className="group relative mx-auto w-full max-w-[420px] overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-[0_4px_24px_-8px_rgba(50,40,20,0.08)] transition-all duration-300 hover:shadow-[0_20px_60px_-16px_rgba(50,40,20,0.22)]"
    >
      {/* Header — 170px gradient with badges + price */}
      <div className={cn('relative h-[170px] bg-gradient-to-br', cover)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_60%)]" />

        {/* Category badge top‑left */}
        <div className="absolute left-4 top-4 inline-flex h-[30px] items-center rounded-full bg-white/80 px-[10px] text-[12px] font-medium tracking-[0.05em] text-stone-700 backdrop-blur-sm">
          {meta}
        </div>

        {/* Status badge top‑right */}
        <div className="absolute right-4 top-4">
          <span className={cn('inline-flex h-[30px] items-center gap-1.5 rounded-full px-[10px] text-[12px] font-medium',
            menu.isActive ? 'bg-emerald-500/10 text-emerald-700' : 'bg-zinc-500/10 text-zinc-600')}>
            <span className={cn('size-[6px] rounded-full', menu.isActive ? 'bg-emerald-500' : 'bg-zinc-400')} />
            {menu.isActive ? 'Actif' : 'Inactif'}
          </span>
        </div>

        {/* Price bottom‑right */}
        <div className="absolute bottom-4 right-5 leading-none drop-shadow-sm tabular-nums">
          <span className="font-display text-[26px] font-medium text-stone-800">{dh(Number(menu.pricePerPerson))}</span>
          <span className="ml-1.5 font-sans text-[11px] font-medium text-stone-500/80">/ pers.</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-2xl leading-snug tracking-tight text-stone-900">{menu.name}</h3>
          <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-stone-400 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:scale-110 group-hover:text-stone-900" />
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-500">{menu.description || '—'}</p>

        {/* 3-column stat grid */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatBox icon={Users} label="Min" value={`${menu.minPersons}`} />
          <StatBox icon={Users} label="Max" value={menu.maxPersons ? `${menu.maxPersons}` : '—'} />
          <StatBox icon={Package} label="Items" value={`${itemsCount}`} />
        </div>

        {/* Included items */}
        {preview.length > 0 && (
          <div className="mt-4 rounded-xl border border-stone-100 bg-stone-50/60 p-2.5 pb-2">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">Inclus</div>
            <div className="flex flex-wrap gap-1">
              {preview.map((pi) => (
                <span key={pi.id} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] text-stone-700 shadow-sm border border-stone-100">
                  <span>{ITEM_EMOJI[pi.menuItem.category] || '📦'}</span>
                  {pi.menuItem.name}
                  <span className="text-stone-400">×{pi.defaultQty}</span>
                </span>
              ))}
              {more > 0 && (
                <span className="inline-flex items-center rounded-full bg-stone-900 px-2 py-0.5 text-[11px] font-semibold text-white">+{more}</span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
          <div className="text-[11px] font-medium text-stone-500">{itemsCount} article{itemsCount > 1 ? 's' : ''}</div>
          <div className="flex items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <IconBtn onClick={onView} title="Voir"><Eye className="size-3.5" /></IconBtn>
            <IconBtn onClick={onEdit} title="Modifier"><Pencil className="size-3.5" /></IconBtn>
            <IconBtn onClick={onDelete} title="Supprimer" danger><Trash2 className="size-3.5" /></IconBtn>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ---------------- Stat box ---------------- */

function StatBox({ icon: Icon, label, value }: { icon?: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-100 bg-white px-2.5 py-2">
      <div className="flex items-center gap-[3px] text-[10px] font-medium uppercase tracking-[0.16em] text-stone-400">
        {Icon && <Icon className="size-[10px]" />}
        {label}
      </div>
      <div className="mt-0.5 font-display text-base leading-tight text-stone-900 tabular-nums">{value}</div>
    </div>
  );
}

/* ---------------- Icon button ---------------- */

function IconBtn({ children, danger, ...props }: any) {
  return (
    <button {...props} className={cn(
      'grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-all duration-200 shadow-sm',
      danger
        ? 'hover:border-red-200 hover:bg-red-50 hover:text-red-600'
        : 'hover:border-stone-900 hover:bg-stone-900 hover:text-white'
    )}>
      {children}
    </button>
  );
}

/* ---------------- Sidebar ---------------- */

const CAT_ROW_ICON: Record<string, any> = {
  WEDDING: Heart,
  CORPORATE: Building,
  COCKTAIL: Martini,
  BUFFET: Utensils,
  DESSERT: Cake,
  BRUNCH: Coffee,
  CUSTOM: Sparkles,
};

const CAT_ICON_BG: Record<string, string> = {
  WEDDING: 'bg-rose-100',
  CORPORATE: 'bg-blue-100',
  COCKTAIL: 'bg-purple-100',
  BUFFET: 'bg-amber-100',
  DESSERT: 'bg-pink-100',
  BRUNCH: 'bg-orange-100',
  CUSTOM: 'bg-gray-100',
};

function Sidebar({ menus, onView }: { menus: Menu[]; onView: (m: Menu) => void }) {
  const mostItems = useMemo(() => [...menus].sort((a, b) => (b.menuItems?.length ?? 0) - (a.menuItems?.length ?? 0)).slice(0, 5), [menus]);
  const profitable = useMemo(() => [...menus].sort((a, b) => Number(b.pricePerPerson) - Number(a.pricePerPerson)).slice(0, 5), [menus]);
  const recent = useMemo(() => [...menus].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [menus]);

  const topCats = useMemo(() => {
    const m = new Map<string, number>();
    menus.forEach((menu) => {
      const key = CATEGORY_LABELS[menu.category] || menu.category;
      m.set(key, (m.get(key) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [menus]);

  return (
    <aside className="space-y-4">
      <Panel title="Le plus d&apos;articles" icon={TrendingUp}>
        {mostItems.map((m) => (
          <SidebarRow key={m.id} icon={CAT_ROW_ICON[m.category] || Package} bg={CAT_ICON_BG[m.category] || 'bg-gray-100'}
            name={m.name} sub={CATEGORY_LABELS[m.category] || m.category} right={`${m.menuItems?.length ?? 0} art.`} onClick={() => onView(m)} />
        ))}
      </Panel>
      <Panel title="Les plus chers" icon={BarChart3}>
        {profitable.map((m) => (
          <SidebarRow key={m.id} icon={CAT_ROW_ICON[m.category] || Package} bg={CAT_ICON_BG[m.category] || 'bg-gray-100'}
            name={m.name} sub={CATEGORY_LABELS[m.category] || m.category} right={dh(Number(m.pricePerPerson))} onClick={() => onView(m)} />
        ))}
      </Panel>
      <Panel title="Ajoutés récemment" icon={Clock3}>
        {recent.map((m) => (
          <SidebarRow key={m.id} icon={CAT_ROW_ICON[m.category] || Package} bg={CAT_ICON_BG[m.category] || 'bg-gray-100'}
            name={m.name} sub={CATEGORY_LABELS[m.category] || m.category} right={new Date(m.createdAt).toLocaleDateString('fr-FR')} onClick={() => onView(m)} />
        ))}
      </Panel>
      <Panel title="Top Catégories" icon={Star}>
        <div className="space-y-2">
          {topCats.map(([g, n]) => {
            const max = topCats[0][1];
            return (
              <div key={g}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{g}</span>
                  <span className="text-muted-foreground tabular-nums">{n}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(n / max) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-[var(--gold-soft)] to-[var(--gold-deep)]" />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </aside>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2.5 text-sm font-medium text-foreground">
        <Icon className="size-4 text-foreground" strokeWidth={1.5} />
        {title}
      </div>
      <div className="mt-3 space-y-1.5">{children}</div>
    </div>
  );
}

function SidebarRow({ icon: Icon, bg, name, sub, right, onClick }: {
  icon: any; bg: string; name: string; sub: string; right: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition hover:bg-[var(--surface-soft)]">
      <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', bg)}>
        <Icon className="size-[14px] text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-foreground">{name}</div>
        <div className="truncate text-[10px] text-muted-foreground">{sub}</div>
      </div>
      <div className="shrink-0 text-[11px] font-medium text-foreground tabular-nums">{right}</div>
    </button>
  );
}

/* ---------------- Empty states ---------------- */

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="grid place-items-center rounded-3xl border border-dashed border-border bg-card/60 p-16 text-center"
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--gold-soft)]">
        <Sparkles className="h-7 w-7 text-[var(--gold-deep)]" />
      </div>
      <h3 className="mt-5 font-display text-2xl tracking-tight text-charcoal">Aucun Menu</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">Commencez par créer votre premier menu — formules mariage, buffet, cocktail, brunch… tout ce que vous proposez à vos clients.</p>
      <Button onClick={onCreate} className="mt-6 gap-2 bg-gradient-charcoal text-white shadow-lift hover:opacity-90">
        <Plus className="size-4" /> Créer un Menu
      </Button>
    </motion.div>
  );
}

function NoResultsEmpty({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-16">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm mx-auto">
        <div className="size-20 rounded-[1.25rem] border-2 border-dashed border-border/60 bg-background flex items-center justify-center">
          <Search className="size-9 text-muted-foreground/30" strokeWidth={1.2} />
        </div>
        <div>
          <h3 className="font-display text-2xl text-foreground">Aucun résultat</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Aucun menu ne correspond à votre recherche &laquo; <span className="font-medium text-foreground">{query}</span> &raquo;
          </p>
        </div>
        <button onClick={onClear} className="inline-flex items-center gap-2 bg-foreground hover:opacity-90 text-background rounded-xl px-6 py-3 text-sm font-medium transition-all shadow-sm">
          <X className="size-4" strokeWidth={1.8} /> Effacer la recherche
        </button>
      </div>
    </div>
  );
}
