import { Suspense } from 'react';
import { PrivacyModeProvider } from '@/components/privacy-mode';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { KpiGrid } from '@/features/dashboard/components/DashboardStats';
import { RevenueChart } from '@/features/dashboard/components/RevenueChart';
import { RecentCommandes } from '@/features/dashboard/components/RecentCommandes';
import { PaymentsCard } from '@/features/dashboard/components/PaymentsCard';
import { UpcomingEvents } from '@/features/dashboard/components/UpcomingEvents';
import { MiniCalendar } from '@/features/dashboard/components/MiniCalendar';
import { BusinessHealth } from '@/features/dashboard/components/BusinessHealth';
import { QuickActions } from '@/features/dashboard/components/QuickActions';
import { PerformanceCharts } from '@/features/dashboard/components/PerformanceCharts';
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
import {
  fetchKpiSection,
  fetchRevenueChartSection,
  fetchRecentCommandesSection,
  fetchPaymentsSection,
  fetchUpcomingEventsSection,
  fetchBusinessHealthSection,
  fetchPerformanceSection,
  fetchSidebarSection,
} from '@/features/dashboard/lib/get-dashboard-data-sections';

export default async function DashboardPage() {
  return (
    <PrivacyModeProvider>
      <DashboardShell />
    </PrivacyModeProvider>
  );
}

async function DashboardShell() {
  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        <DashboardHeader />

        <div className="mt-8 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-9 space-y-6">
            <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-2xl border border-border bg-card p-5 h-36 animate-pulse" />)}</div>}>
              <KpiSection />
            </Suspense>

            <Suspense fallback={<div className="rounded-2xl border border-border bg-card p-6 h-80 animate-pulse" />}>
              <RevenueChartSection />
            </Suspense>

            <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-5 gap-6"><div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 h-64 animate-pulse" /><div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 h-64 animate-pulse" /></div>}>
              <CommandesAndPaymentsRow />
            </Suspense>

            <Suspense fallback={<div className="rounded-2xl border border-border bg-card p-5 h-48 animate-pulse" />}>
              <UpcomingEventsSection />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MiniCalendar />
              <Suspense fallback={<div className="rounded-2xl border border-border bg-card p-6 h-64 animate-pulse" />}>
                <BusinessHealthSection />
              </Suspense>
            </div>

            <QuickActions />

            <Suspense fallback={<div className="rounded-2xl border border-border bg-card p-6 h-48 animate-pulse" />}>
              <PerformanceSection />
            </Suspense>
          </div>

          <Suspense fallback={
            <aside className="col-span-12 xl:col-span-3 space-y-6">
              <div className="xl:sticky xl:top-24 space-y-6">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-2xl border border-border bg-card p-5 h-48 animate-pulse" />)}
              </div>
            </aside>
          }>
            <SidebarSection />
          </Suspense>
        </div>

        <footer className="mt-16 mb-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Tous les services opérationnels
          </div>
          <div>&copy; TUR &mdash; Suite traiteur premium</div>
        </footer>
      </div>
    </div>
  );
}

async function KpiSection() {
  const kpis = await fetchKpiSection();
  if (!kpis) return null;
  return <KpiGrid kpis={kpis} />;
}

async function RevenueChartSection() {
  const data = await fetchRevenueChartSection();
  if (!data) return null;
  return <RevenueChart {...data} />;
}

async function CommandesAndPaymentsRow() {
  const [commandes, payments] = await Promise.all([
    fetchRecentCommandesSection(),
    fetchPaymentsSection(),
  ]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3">
        {commandes ? <RecentCommandes commandes={commandes} /> : null}
      </div>
      <div className="lg:col-span-2">
        {payments ? <PaymentsCard {...payments} /> : null}
      </div>
    </div>
  );
}

async function UpcomingEventsSection() {
  const events = await fetchUpcomingEventsSection();
  if (!events) return null;
  return <UpcomingEvents events={events} />;
}

async function BusinessHealthSection() {
  const health = await fetchBusinessHealthSection();
  if (!health) return null;
  return <BusinessHealth health={health} />;
}

async function PerformanceSection() {
  const data = await fetchPerformanceSection();
  if (!data) return null;
  return <PerformanceCharts {...data} />;
}

async function SidebarSection() {
  const data = await fetchSidebarSection();
  if (!data) return null;
  return <DashboardSidebar {...data} />;
}
