'use client';

import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Users, Wallet, Crown } from 'lucide-react';
import { ClientsTable } from '@/features/clients/components/clients-table';
import { NoClientsEmptyState, NoResultsEmptyState } from '@/features/clients/components/ClientEmptyStates';
import type { ClientWithStats } from '@/features/clients/types';
import type { ClientStats } from '@/features/clients/actions/get-client-stats';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

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
        <span className="text-xs text-muted-foreground/60">{clients.length} r&eacute;sultat{clients.length > 1 ? 's' : ''}</span>
      </div>
      <ClientsTable data={clients} loading={isLoading} onView={onView} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

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
        <span className="text-xs text-muted-foreground/60">{clients.length} r&eacute;sultat{clients.length > 1 ? 's' : ''}</span>
      </div>
      {clients.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-4 text-center">
          <div className="size-14 rounded-xl bg-foreground/[0.03] flex items-center justify-center">
            <Users className="size-6 text-muted-foreground/30" strokeWidth={1.2} />
          </div>
          <p className="text-sm text-muted-foreground">Aucun client &agrave; afficher</p>
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
                    <span>{c.eventsCount} &eacute;v&eacute;nement{c.eventsCount > 1 ? 's' : ''}</span>
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

function RecentClientsSection({ clients }: { clients: ClientWithStats[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Clients</div>
          <h3 className="font-display text-2xl mt-1">Clients r&eacute;cents</h3>
        </div>
      </div>
      {clients.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-4 text-center">
          <div className="size-14 rounded-xl bg-foreground/[0.03] flex items-center justify-center">
            <Users className="size-6 text-muted-foreground/30" strokeWidth={1.2} />
          </div>
          <p className="text-sm text-muted-foreground">Aucun client r&eacute;cent &agrave; afficher</p>
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
                    <span>{c.eventsCount} &eacute;v&egrave;nement{c.eventsCount > 1 ? 's' : ''}</span>
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
            <p className="text-sm font-medium text-muted-foreground">Aucune donn&eacute;e financi&egrave;re disponible</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-[240px]">
              Cr&eacute;ez votre premi&egrave;re commande pour afficher les statistiques.
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

export function ClientsGrid({
  viewMode, filteredClients, isLoading,
  onView, onEdit, onDelete,
  recentClients, stats, totalRevenue, avgValue, activePct, totalCommandes,
  hasNoClients, hasNoResults, searchQuery, onClearSearch, onAdd,
}: {
  viewMode: 'table' | 'cards';
  filteredClients: ClientWithStats[];
  isLoading: boolean;
  onView: (c: ClientWithStats) => void;
  onEdit: (c: ClientWithStats) => void;
  onDelete: (c: ClientWithStats) => void;
  recentClients: ClientWithStats[];
  stats: ClientStats | null;
  totalRevenue: number;
  avgValue: number;
  activePct: number;
  totalCommandes: number;
  hasNoClients: boolean;
  hasNoResults: boolean;
  searchQuery: string;
  onClearSearch: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex-1 min-w-0 space-y-6">
      {hasNoClients ? (
        <NoClientsEmptyState onAdd={onAdd} />
      ) : hasNoResults ? (
        <NoResultsEmptyState query={searchQuery} onClear={onClearSearch} />
      ) : (
        <>
          {viewMode === 'table' ? (
            <ClientsTableSection
              clients={filteredClients}
              isLoading={isLoading}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ) : (
            <ClientCardsView clients={filteredClients} isLoading={isLoading} onView={onView} />
          )}
          {viewMode === 'table' && recentClients.length > 0 && (
            <RecentClientsSection clients={recentClients} />
          )}
          <ClientAnalytics
            stats={stats} totalRevenue={totalRevenue} avgValue={avgValue}
            activePct={activePct} totalCommandes={totalCommandes}
          />
        </>
      )}
    </div>
  );
}
