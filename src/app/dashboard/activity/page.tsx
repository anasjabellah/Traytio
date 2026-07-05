"use client";

import { useState } from "react";
import { Activity, RotateCw } from "lucide-react";
import { PrivacyModeProvider } from '@/components/privacy-mode';
import { useActivityFeed } from '@/features/activity/hooks/use-activity';
import { ActivityStats } from '@/features/activity/components/ActivityStats';
import { ActivityFilters } from '@/features/activity/components/ActivityFilters';
import { ActivityTimeline } from '@/features/activity/components/ActivityTimeline';
import { ActivitySkeleton } from '@/features/activity/components/ActivitySkeleton';
import type { ActivityType } from '@/features/activity/types';

export default function ActivityPage() {
  return (
    <PrivacyModeProvider>
      <PageContent />
    </PrivacyModeProvider>
  );
}

function PageContent() {
  const { items, stats, loading, error, refresh } = useActivityFeed();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[280px] bg-radiance" />

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ── Page header ── */}
        <div className="flex items-start sm:items-center justify-between mb-7 flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-[0_2px_8px_rgba(201,168,76,0.25)]">
              <Activity className="size-5 text-gold-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-medium leading-tight text-foreground">
                Activit&eacute;
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Fil d&rsquo;activit&eacute; de votre organisation
              </p>
            </div>
          </div>
          <button
            onClick={() => refresh()}
            className="inline-flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-medium bg-[var(--surface-elevated)] text-muted-foreground ring-1 ring-border/40 hover:ring-border/70 hover:text-foreground transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:translate-y-px"
          >
            <RotateCw className="size-3" strokeWidth={1.5} />
            Actualiser
          </button>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <ActivitySkeleton />
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="size-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <Activity className="size-7 text-destructive" strokeWidth={1.2} />
            </div>
            <p className="font-heading text-lg text-foreground/80">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            <button
              onClick={() => refresh()}
              className="h-8 rounded-lg px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              R&eacute;essayer
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <ActivityStats stats={stats} />

            <ActivityFilters
              search={search}
              onSearchChange={setSearch}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
            />

            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-soft">
              <ActivityTimeline items={items} search={search} typeFilter={typeFilter} />
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="mt-12 pt-6 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Tous les services op&eacute;rationnels
          </div>
          <div>&copy; TUR &mdash; Suite traiteur premium</div>
        </footer>
      </div>
    </div>
  );
}
