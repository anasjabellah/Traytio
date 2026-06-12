'use client';

import { Search, X, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SORT_OPTIONS } from '@/features/clients/hooks/use-clients-filters';

export function ClientsToolbar({
  searchQuery, onSearchChange, onClearSearch,
  sortBy, onSortChange,
  viewMode, onViewModeChange,
  showFilters, onToggleFilters,
  onRefresh,
}: {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onClearSearch: () => void;
  sortBy: string;
  onSortChange: (v: string) => void;
  viewMode: 'table' | 'cards';
  onViewModeChange: (v: 'table' | 'cards') => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="mt-8 flex flex-col lg:flex-row lg:items-center gap-3">
      <div className="flex items-center gap-2 px-4 h-11 rounded-xl border border-border bg-card shadow-soft flex-1 max-w-[400px] transition-all focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/30">
        <Search className="size-4 text-muted-foreground shrink-0" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Nom, email, t&eacute;l&eacute;phone, ville..."
          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
        />
        {searchQuery && (
          <button onClick={onClearSearch} className="size-5 rounded-full hover:bg-secondary flex items-center justify-center">
            <X className="size-3 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <div className="flex p-0.5 rounded-xl bg-foreground/[0.04] border border-border">
          <button
            onClick={() => onViewModeChange('table')}
            className={`h-10 px-3 rounded-[10px] text-sm font-medium transition-all ${
              viewMode === 'table'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => onViewModeChange('cards')}
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
          onChange={(e) => onSortChange(e.target.value)}
          className="h-11 rounded-xl border border-border bg-card shadow-soft px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A94A]/20 focus:border-[#D4A94A] text-foreground"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

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
          title="Actualiser"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
