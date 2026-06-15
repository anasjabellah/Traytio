'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, RefreshCw, Plus, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCommandes } from '@/features/commandes/hooks/use-commandes';
import { CommandesTable } from '@/features/commandes/components/commandes-table';
import { DeleteCommandeDialog } from '@/features/commandes/components/delete-commande-dialog';
import { COMMANDE_STATUS_LABELS } from '@/features/commandes/constants';
import type { Commande } from '@/features/commandes/types';

export default function CommandesPage() {
  const router = useRouter();
  const { commandes, isLoading, pagination, search, statusFilter, handleSearch, handleStatusFilter, handlePageChange, refresh } = useCommandes();
  const [deleteTarget, setDeleteTarget] = useState<Commande | null>(null);

  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch, handleSearch]);

  const handleView = useCallback((cmd: Commande) => {
    router.push(`/dashboard/commandes/${cmd.id}`);
  }, [router]);

  const handleEdit = useCallback((cmd: Commande) => {
    router.push(`/dashboard/commandes/${cmd.id}/edit`);
  }, [router]);

  const statusKeys = Object.keys(COMMANDE_STATUS_LABELS);

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <ShoppingBag className="size-3 text-[var(--gold-deep)]" />
              <span>Gestion des commandes</span>
            </div>
            <h1 className="font-display text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05]">
              Commandes
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {pagination.total} commande{pagination.total > 1 ? 's' : ''} au total
            </p>
          </div>
          <a
            href="/dashboard/commandes/new"
            className="inline-flex items-center gap-2 bg-foreground hover:opacity-90 text-background rounded-xl px-5 py-2.5 text-sm font-medium transition-all shadow-sm shrink-0"
          >
            <Plus className="size-4" strokeWidth={1.8} />
            Nouvelle commande
          </a>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
          <div className="flex items-center gap-2 px-4 h-11 rounded-xl border border-border bg-card shadow-soft flex-1 max-w-[400px] transition-all focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/30">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Référence, client, événement..."
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
            {localSearch && (
              <button onClick={() => { setLocalSearch(''); handleSearch(''); }} className="size-5 rounded-full hover:bg-secondary flex items-center justify-center">
                <X className="size-3 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter ?? ''}
              onChange={(e) => handleStatusFilter(e.target.value || null)}
              className="h-11 rounded-xl border border-border bg-card shadow-soft px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A94A]/20 focus:border-[#D4A94A]"
            >
              <option value="">Tous les statuts</option>
              {statusKeys.map((key) => (
                <option key={key} value={key}>{COMMANDE_STATUS_LABELS[key]}</option>
              ))}
            </select>

            <button
              onClick={refresh}
              className="size-11 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors flex items-center justify-center"
              title="Actualiser"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold">Liste</div>
              <h3 className="font-display text-xl mt-0.5">Toutes les commandes</h3>
            </div>
            <span className="text-xs text-muted-foreground/60">{commandes.length} résultat{commandes.length > 1 ? 's' : ''}</span>
          </div>
          <CommandesTable
            data={commandes}
            loading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
          />
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Page {pagination.page} sur {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="size-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-4" />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`size-9 rounded-lg text-xs font-medium transition-colors ${
                    p === pagination.page
                      ? 'bg-foreground text-background'
                      : 'border border-border hover:bg-muted/50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="size-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 mb-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Tous les services opérationnels
          </div>
          <div>© TUR — Suite traiteur premium</div>
        </footer>
      </div>

      {deleteTarget && (
        <DeleteCommandeDialog
          commande={deleteTarget}
          open={true}
          onOpenChange={() => setDeleteTarget(null)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
