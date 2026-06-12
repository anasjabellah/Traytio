'use client';

import { Search, X, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { STATUS_LABELS } from '@/features/events/types';
import { EVENT_TYPE_LABELS, eventTypeKeys, type ViewMode } from '@/features/events/constants';

export function EventsFilters({
  searchQuery, onSearchChange, onClearSearch,
  statusFilter, onStatusFilterChange,
  typeFilter, onTypeFilterChange,
  paymentFilter, onPaymentFilterChange,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
  budgetMin, onBudgetMinChange,
  budgetMax, onBudgetMaxChange,
  viewMode, onViewModeChange,
  showFilters, onToggleFilters,
  onRefresh, onResetFilters,
  filteredCount,
}: {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onClearSearch: () => void;
  statusFilter: string | null;
  onStatusFilterChange: (v: string | null) => void;
  typeFilter: string | null;
  onTypeFilterChange: (v: string | null) => void;
  paymentFilter: string | null;
  onPaymentFilterChange: (v: string | null) => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
  budgetMin: string;
  onBudgetMinChange: (v: string) => void;
  budgetMax: string;
  onBudgetMaxChange: (v: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onRefresh: () => void;
  onResetFilters: () => void;
  filteredCount: number;
}) {
  const statusKeys = Object.keys(STATUS_LABELS);

  return (
    <>
      {/* Search + Filters + View toggle */}
      <div className="mt-8 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-2 px-4 h-11 rounded-xl border border-border bg-card shadow-soft flex-1 max-w-[400px] transition-all focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/30">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nom, client, téléphone, lieu..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button onClick={onClearSearch} className="size-5 rounded-full hover:bg-secondary flex items-center justify-center">
              <X className="size-3 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleFilters}
            className={`h-11 rounded-xl gap-2 px-4 ${showFilters ? 'bg-foreground text-background hover:bg-foreground/90' : ''}`}
          >
            <SlidersHorizontal className="size-3.5" />
            Filtres
          </Button>
          <button
            onClick={onRefresh}
            className="size-11 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors flex items-center justify-center"
            title="Rafraîchir"
          >
            <RefreshCw className="size-3.5" />
          </button>
          <div className="flex p-0.5 rounded-xl bg-foreground/[0.04] border border-border">
            <button
              onClick={() => onViewModeChange('table')}
              className={`h-10 px-4 rounded-[10px] text-sm font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => onViewModeChange('calendar')}
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
                    onChange={(e) => onStatusFilterChange(e.target.value || null)}
                    className="w-full h-9 rounded-lg border border-border bg-surface-soft px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A94A]/20 focus:border-[#D4A94A]"
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
                    onChange={(e) => onTypeFilterChange(e.target.value || null)}
                    className="w-full h-9 rounded-lg border border-border bg-surface-soft px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A94A]/20 focus:border-[#D4A94A]"
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
                    onChange={(e) => onPaymentFilterChange(e.target.value || null)}
                    className="w-full h-9 rounded-lg border border-border bg-surface-soft px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A94A]/20 focus:border-[#D4A94A]"
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
                    onChange={(e) => onDateFromChange(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-surface-soft px-3 text-xs focus:outline-none focus:border-gold [color-scheme:light]"
                  />
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Au</div>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => onDateToChange(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-surface-soft px-3 text-xs focus:outline-none focus:border-gold [color-scheme:light]"
                  />
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Budget min</div>
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => onBudgetMinChange(e.target.value)}
                    placeholder="0"
                    className="w-full h-9 rounded-lg border border-border bg-surface-soft px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A94A]/20 focus:border-[#D4A94A]"
                  />
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Budget max</div>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => onBudgetMaxChange(e.target.value)}
                    placeholder="999999"
                    className="w-full h-9 rounded-lg border border-border bg-surface-soft px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A94A]/20 focus:border-[#D4A94A]"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={onResetFilters}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
