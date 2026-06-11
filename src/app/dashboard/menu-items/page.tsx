'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Download, Search, LayoutGrid, List, Eye, Pencil, Copy,
  Archive, X, Sparkles, TrendingUp, Star, Clock,
  ChefHat, Wine, Cake, Flower2, Users, Box,
  Settings2, CheckCircle2, CircleDashed, ArrowUpRight,
  Crown, Trash2, BarChart3, Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { useMenuItems } from '@/features/menu-items/hooks/use-menu-items';
import { useMenuItemForm } from '@/features/menu-items/hooks/use-menu-item-form';
import { MenuItemsTable } from '@/features/menu-items/components/menu-items-table';
import { CreateMenuItemDialog } from '@/features/menu-items/components/create-menu-item-dialog';
import { EditMenuItemDialog } from '@/features/menu-items/components/edit-menu-item-dialog';
import { DeleteMenuItemDialog } from '@/features/menu-items/components/delete-menu-item-dialog';
import type { MenuItem, MenuItemCategory } from '@/features/menu-items/types';
import { CATEGORY_LABELS, CATEGORY_BADGE_COLORS } from '@/features/menu-items/constants';
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

const CAT_GROUP: Record<MenuItemCategory, string> = {
  FOOD: 'Food', DRINKS: 'Drinks', DESSERTS: 'Desserts',
  DECORATION: 'Decoration', STAFF: 'Services',
  ENTERTAINMENT: 'Services', EXTRAS: 'Services',
};

const CAT_ICON: Record<string, any> = {
  Food: ChefHat, Drinks: Wine, Desserts: Cake,
  Decoration: Flower2, Services: Users,
};

const CAT_ACCENT: Record<string, string> = {
  Food: 'from-amber-50 to-orange-50',
  Drinks: 'from-emerald-50 to-teal-50',
  Desserts: 'from-rose-50 to-pink-50',
  Decoration: 'from-fuchsia-50 to-rose-50',
  Services: 'from-violet-50 to-indigo-50',
};

const CAT_CHIPS = [
  { key: 'ALL', label: 'Toutes catégories' },
  ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label })),
];

const ITEM_EMOJI: Record<string, string> = {
  FOOD: '🍲', DRINKS: '🍹', DESSERTS: '🍬',
  DECORATION: '💐', STAFF: '🎩',
  ENTERTAINMENT: '🎧', EXTRAS: '🎆',
};

const ITEM_ACCENT: Record<string, string> = {
  FOOD: 'from-amber-100 via-orange-50 to-rose-50',
  DRINKS: 'from-emerald-100 via-teal-50 to-lime-50',
  DESSERTS: 'from-pink-100 via-rose-50 to-amber-50',
  DECORATION: 'from-fuchsia-100 via-rose-50 to-amber-50',
  STAFF: 'from-stone-100 via-zinc-50 to-neutral-100',
  ENTERTAINMENT: 'from-violet-100 via-purple-50 to-fuchsia-50',
  EXTRAS: 'from-gray-100 via-zinc-50 to-stone-100',
};

type ViewMode = 'grid' | 'table';
type StatusFilter = 'all' | 'active' | 'inactive';

export default function MenuItemsPage() {
  const { items, isLoading, error, pagination, handleSearch, refresh } = useMenuItems();
  const {
    isCreateOpen, isEditOpen, isDeleteOpen, selectedItem,
    openCreate, openEdit, openDelete, openDuplicate, openArchive, closeAll,
  } = useMenuItemForm();

  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priceMax, setPriceMax] = useState(15000);
  const [view, setView] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (catFilter !== 'ALL' && it.category !== catFilter) return false;
      if (statusFilter === 'active' && !it.isActive) return false;
      if (statusFilter === 'inactive' && it.isActive) return false;
      if (Number(it.unitPrice) > priceMax) return false;
      if (!q) return true;
      return [it.name, it.category, it.notes || ''].some((s) => s.toLowerCase().includes(q));
    });
  }, [items, query, catFilter, statusFilter, priceMax]);

  const kpis = useMemo(() => {
    const byCat = (g: string) => items.filter((i) => CAT_GROUP[i.category] === g).length;
    return {
      total: items.length,
      food: byCat('Food'),
      drinks: byCat('Drinks'),
      desserts: byCat('Desserts'),
      decoration: byCat('Decoration'),
      services: byCat('Services'),
      active: items.filter((i) => i.isActive).length,
      inactive: items.filter((i) => !i.isActive).length,
    };
  }, [items]);

  const handleView = useCallback((item: MenuItem) => { window.location.href = `/dashboard/menu-items/${item.id}`; }, []);
  const handleEdit = useCallback((item: MenuItem) => openEdit(item), [openEdit]);
  const handleDelete = useCallback((item: MenuItem) => openDelete(item), [openDelete]);
  const handleDuplicate = useCallback((item: MenuItem) => { openDuplicate(item).then(() => refresh()); }, [openDuplicate, refresh]);
  const handleArchive = useCallback((item: MenuItem) => { openArchive(item).then(() => refresh()); }, [openArchive, refresh]);

  const isSearching = query.length > 0;
  const hasNoResults = !isLoading && isSearching && filtered.length === 0;
  const hasNoItems = !isLoading && !isSearching && items.length === 0;

  const fillPct = ((priceMax - 50) / (15000 - 50)) * 100;

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <style>{`
        .tur-range-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: linear-gradient(to right, #D4A03A var(--fill), #E5E0D6 var(--fill));
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .tur-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #D4A03A;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.18);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          cursor: pointer;
        }
        .tur-range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
        .tur-range-slider::-moz-range-track {
          height: 4px;
          background: #E5E0D6;
          border-radius: 2px;
          border: none;
        }
        .tur-range-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #D4A03A;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.18);
          cursor: pointer;
        }
        .tur-range-slider::-moz-range-progress {
          background: #D4A03A;
          height: 4px;
          border-radius: 2px;
        }
        .tur-range-slider:focus-visible {
          outline: 2px solid #D4A03A;
          outline-offset: 3px;
          border-radius: 2px;
        }
      `}</style>

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
              Menu Items
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Gérez tous les produits, services et éléments disponibles pour vos événements.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-10 rounded-lg border-border bg-background/60 backdrop-blur gap-2" onClick={() => setShowFilters((s) => !s)}>
              <Settings2 className="size-4" /> Filtres
            </Button>
            <Button variant="outline" size="sm" className="h-10 rounded-lg border-border bg-background/60 backdrop-blur gap-2" onClick={() => {
              const csv = items.map(i => `${i.name},${i.category},${Number(i.unitPrice)},${i.isActive ? 'Actif' : 'Masqué'},${new Date(i.updatedAt).toISOString()}`).join('\n');
              const blob = new Blob(['Nom,Catégorie,Prix,Statut,Mise à jour\n' + csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'menu-items.csv'; a.click();
              URL.revokeObjectURL(url);
            }}>
              <Download className="size-4" /> Export
            </Button>
            <Button onClick={() => { openCreate(); }} className="h-10 rounded-lg bg-gradient-charcoal text-white shadow-lift hover:opacity-95 gap-2 px-4">
              <Plus className="size-4" /> Nouveau Menu Item
            </Button>
          </div>
        </div>

        {/* 8 KPIs */}
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <KpiCard label="Total Items" value={kpis.total} icon={Box} accent="from-stone-50 to-stone-100" />
          <KpiCard label="Food" value={kpis.food} icon={ChefHat} accent="from-amber-50 to-orange-50" />
          <KpiCard label="Drinks" value={kpis.drinks} icon={Wine} accent="from-emerald-50 to-teal-50" />
          <KpiCard label="Desserts" value={kpis.desserts} icon={Cake} accent="from-rose-50 to-pink-50" />
          <KpiCard label="Decoration" value={kpis.decoration} icon={Flower2} accent="from-fuchsia-50 to-rose-50" />
          <KpiCard label="Services" value={kpis.services} icon={Users} accent="from-violet-50 to-indigo-50" />
          <KpiCard label="Active" value={kpis.active} icon={CheckCircle2} accent="from-[var(--gold-soft)] to-amber-50" gold />
          <KpiCard label="Inactive" value={kpis.inactive} icon={CircleDashed} accent="from-zinc-50 to-stone-100" />
        </div>

        {/* Toolbar */}
        <div className="mt-8 rounded-2xl border border-border/60 bg-card/80 p-3 shadow-soft backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un Menu Item — nom, catégorie, description…"
                className="h-11 rounded-xl border-transparent bg-[var(--surface-soft)] pl-11 text-sm focus-visible:bg-background"
              />
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background p-1">
              {(['all', 'active', 'inactive'] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition', statusFilter === s ? 'bg-gradient-charcoal text-white' : 'text-muted-foreground hover:text-foreground')}
                >{s === 'all' ? 'Tous' : s === 'active' ? 'Active' : 'Inactive'}</button>
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
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-foreground">Prix max</span>
                    <div className="relative flex w-44 items-center">
                      <input
                        type="range"
                        min={50}
                        max={15000}
                        step={50}
                        value={priceMax}
                        onChange={(e) => setPriceMax(Number(e.target.value))}
                        className="tur-range-slider w-full"
                        style={{ '--fill': `${fillPct}%` } as React.CSSProperties}
                      />
                    </div>
                    <span className="tabular-nums text-foreground min-w-[80px]">{dh(priceMax)}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => { setCatFilter('ALL'); setStatusFilter('all'); setQuery(''); setPriceMax(15000); }}>
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
              <GridView items={filtered} loading={isLoading} onView={handleView} onEdit={handleEdit} onDuplicate={handleDuplicate} onArchive={handleArchive} onDelete={handleDelete} />
            ) : (
              <div className="rounded-2xl border border-border bg-card shadow-soft">
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold">Liste</div>
                    <h3 className="font-display text-xl mt-0.5">Tous les articles</h3>
                  </div>
                  <span className="text-xs text-muted-foreground/60">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
                </div>
                <MenuItemsTable data={filtered} loading={isLoading} onEdit={handleEdit} onDelete={handleDelete} onDuplicate={handleDuplicate} onArchive={handleArchive} />
              </div>
            )}
          </div>

          <Sidebar items={items} onView={handleView} />
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
      <CreateMenuItemDialog open={isCreateOpen} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      {isEditOpen && selectedItem && (
        <EditMenuItemDialog item={selectedItem} open={true} onClose={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
      {isDeleteOpen && selectedItem && (
        <DeleteMenuItemDialog item={selectedItem} open={true} onOpenChange={(open) => { if (!open) closeAll(); }} onSuccess={refresh} />
      )}
    </div>
  );
}

/* ---------------- KPI ---------------- */

function KpiCard({ label, value, icon: Icon, accent, gold }: { label: string; value: number; icon: any; accent: string; gold?: boolean }) {
  const v = useCounter(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn('relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition', gold && 'ring-1 ring-[var(--gold)]/40')}
    >
      <div className={cn('absolute inset-0 -z-0 bg-gradient-to-br opacity-60', accent)} />
      <div className="relative flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-background/80 backdrop-blur">
          <Icon className={cn('size-4', gold ? 'text-[var(--gold-deep)]' : 'text-charcoal')} />
        </div>
        {gold && <Crown className="size-3.5 text-[var(--gold-deep)]" />}
      </div>
      <div className="relative mt-4 font-display text-3xl tracking-tight text-charcoal tabular-nums">{v}</div>
      <div className="relative mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </motion.div>
  );
}

/* ---------------- Grid view ---------------- */

function GridView({ items, loading, onView, onEdit, onDuplicate, onArchive, onDelete }: {
  items: MenuItem[]; loading: boolean;
  onView: (i: MenuItem) => void;
  onEdit: (i: MenuItem) => void;
  onDuplicate: (i: MenuItem) => void;
  onArchive: (i: MenuItem) => void;
  onDelete: (i: MenuItem) => void;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden animate-pulse">
            <div className="h-44 bg-foreground/[0.04]" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-foreground/[0.06] rounded w-3/4" />
              <div className="h-3 bg-foreground/[0.04] rounded w-full" />
              <div className="h-3 bg-foreground/[0.04] rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.025 } } }}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((it) => {
        const accent = ITEM_ACCENT[it.category] || 'from-gray-100 to-gray-50';
        const emoji = ITEM_EMOJI[it.category] || '📦';
        return (
          <motion.article
            key={it.id}
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -4 }}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition hover:shadow-lift"
          >
            <div className={cn('relative h-44 overflow-hidden bg-gradient-to-br', accent)}>
              <div className="absolute inset-0 grid place-items-center text-7xl drop-shadow-sm transition-transform duration-500 group-hover:scale-110">
                {it.imageUrl ? (
                  <img src={it.imageUrl} alt="" className={cn('h-full w-full object-cover', it.category === 'FOOD' ? 'object-top' : 'object-center')} />
                ) : (
                  <span>{emoji}</span>
                )}
              </div>
              <div className="absolute left-3 top-3 flex items-center gap-2">
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm backdrop-blur-md ring-1', it.isActive ? 'bg-emerald-600/85 text-white ring-white/20' : 'bg-zinc-500/70 text-white ring-white/10')}>
                  {it.isActive ? '● Active' : '○ Inactive'}
                </span>
              </div>
              <div className={cn('absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm backdrop-blur-md', CATEGORY_BADGE_COLORS[it.category as keyof typeof CATEGORY_BADGE_COLORS] || 'bg-background/80 text-foreground')}>
                {CAT_CHIPS.find(c => c.key === it.category)?.label || it.category}
              </div>
              <div className="absolute inset-x-3 bottom-3 flex translate-y-2 items-center gap-1.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <CardAction icon={Eye} label="View" onClick={() => onView(it)} />
                <CardAction icon={Pencil} label="Edit" onClick={() => onEdit(it)} />
                <CardAction icon={Copy} label="Duplicate" onClick={() => onDuplicate(it)} />
                <CardAction icon={Archive} label="Archive" onClick={() => onArchive(it)} />
                <CardAction icon={Trash2} label="Delete" onClick={() => onDelete(it)} red />
              </div>
            </div>
            <button onClick={() => onView(it)} className="block w-full p-5 text-left">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg leading-tight tracking-tight text-charcoal">{it.name}</h3>
                <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{it.notes || '—'}</p>
              <div className="mt-4 flex items-end justify-between border-t border-border/60 pt-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Prix</div>
                  <div className="font-display text-xl text-charcoal tabular-nums">{dh(Number(it.unitPrice))}</div>
                  <div className="text-[11px] text-muted-foreground">/ {it.unit || '—'}</div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] text-muted-foreground">
                  <TrendingUp className="size-3 text-[var(--gold-deep)]" />
                  {(it.usageCount ?? 0)}× utilisé
                </div>
              </div>
            </button>
          </motion.article>
        );
      })}
    </motion.div>
  );
}

function CardAction({ icon: Icon, label, onClick, red }: { icon: any; label: string; onClick?: () => void; red?: boolean }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick?.(); }} title={label}
      className={cn('grid h-8 w-8 place-items-center rounded-lg bg-white text-gray-900 shadow-soft backdrop-blur transition', red ? 'hover:bg-red-600 hover:text-white' : 'hover:bg-black hover:text-white')}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

/* ---------------- Sidebar ---------------- */

function Sidebar({ items, onView }: { items: MenuItem[]; onView: (i: MenuItem) => void }) {
  const categoryLabels = CATEGORY_LABELS;

  const mostUsed = useMemo(() => [...items].sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0)).slice(0, 5), [items]);
  const profitable = useMemo(() => [...items].sort((a, b) => (Number(b.unitPrice) * (b.usageCount ?? 1)) - (Number(a.unitPrice) * (a.usageCount ?? 1))).slice(0, 5), [items]);
  const recent = useMemo(() => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [items]);

  const topCats = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((i) => {
      const key = CAT_GROUP[i.category] || 'Autre';
      m.set(key, (m.get(key) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  return (
    <aside className="space-y-4">
      <Panel title="Most Used" icon={TrendingUp}>
        {mostUsed.map((it) => (
          <SidebarRow key={it.id} emoji={ITEM_EMOJI[it.category] || '📦'} accent={ITEM_ACCENT[it.category] || 'from-gray-100 to-gray-50'}
            name={it.name} sub={categoryLabels[it.category] || it.category} right={`${it.usageCount ?? 0}×`} onClick={() => onView(it)} />
        ))}
      </Panel>
      <Panel title="Most Profitable" icon={BarChart3} gold>
        {profitable.map((it) => (
          <SidebarRow key={it.id} emoji={ITEM_EMOJI[it.category] || '📦'} accent={ITEM_ACCENT[it.category] || 'from-gray-100 to-gray-50'}
            name={it.name} sub={categoryLabels[it.category] || it.category} right={dh(Number(it.unitPrice) * (it.usageCount ?? 1))} onClick={() => onView(it)} />
        ))}
      </Panel>
      <Panel title="Recently Added" icon={Clock}>
        {recent.map((it) => (
          <SidebarRow key={it.id} emoji={ITEM_EMOJI[it.category] || '📦'} accent={ITEM_ACCENT[it.category] || 'from-gray-100 to-gray-50'}
            name={it.name} sub={categoryLabels[it.category] || it.category} right={new Date(it.createdAt).toLocaleDateString('fr-FR')} onClick={() => onView(it)} />
        ))}
      </Panel>
      <Panel title="Top Categories" icon={Star}>
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

function Panel({ title, icon: Icon, gold, children }: { title: string; icon: any; gold?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-border/60 bg-card p-4 shadow-soft', gold && 'ring-1 ring-[var(--gold)]/30')}>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className={cn('size-4', gold ? 'text-[var(--gold-deep)]' : 'text-muted-foreground')} />
        {title}
      </div>
      <div className="mt-3 space-y-1.5">{children}</div>
    </div>
  );
}

function SidebarRow({ emoji, accent, name, sub, right, onClick }: {
  emoji: string; accent: string; name: string; sub: string; right: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition hover:bg-[var(--surface-soft)]">
      <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-base', accent)}>{emoji}</div>
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
      <h3 className="mt-5 font-display text-2xl tracking-tight text-charcoal">Aucun Menu Item</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">Commencez par créer votre premier Menu Item — plats, boissons, décoration, services… tout ce que vous offrez à vos clients.</p>
      <Button onClick={onCreate} className="mt-6 gap-2 bg-gradient-charcoal text-white shadow-lift hover:opacity-90">
        <Plus className="size-4" /> Créer un Menu Item
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
            Aucun article ne correspond à votre recherche &laquo; <span className="font-medium text-foreground">{query}</span> &raquo;
          </p>
        </div>
        <button onClick={onClear} className="inline-flex items-center gap-2 bg-foreground hover:opacity-90 text-background rounded-xl px-6 py-3 text-sm font-medium transition-all shadow-sm">
          <X className="size-4" strokeWidth={1.8} /> Effacer la recherche
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, gold, small }: { label: string; value: string | React.ReactNode; icon: any; gold?: boolean; small?: boolean }) {
  return (
    <div className={cn('rounded-xl border border-border/60 bg-card p-3', gold && 'ring-1 ring-[var(--gold)]/40 bg-gradient-to-br from-[var(--gold-soft)]/40 to-card')}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className={cn('size-3', gold ? 'text-[var(--gold-deep)]' : '')} />
        {label}
      </div>
      <div className={cn('mt-1.5 font-display text-charcoal tabular-nums', small ? 'text-base leading-tight' : 'text-xl')}>{value}</div>
    </div>
  );
}
