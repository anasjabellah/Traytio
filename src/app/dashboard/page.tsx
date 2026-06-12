"use client"

import { useMemo } from "react";
import {
  Wallet, Receipt, PartyPopper, Users, Clock, Banknote,
} from "lucide-react";
import { PrivacyModeProvider } from '@/components/privacy-mode';
import { useDashboardData } from '@/features/dashboard/hooks/use-dashboard-data';
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
import { DashboardSkeleton, DashboardError } from '@/features/dashboard/components/DashboardStates';
import type { DashboardData } from '@/features/dashboard/types';

export default function Page() {
  return <Dashboard />;
}

function Dashboard() {
  const { data, loading, error } = useDashboardData();

  return (
    <PrivacyModeProvider>
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        <DashboardHeader />

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <DashboardError message={error} />
        ) : data ? (
          <DashboardContent data={data} />
        ) : null}

        <footer className="mt-16 mb-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Tous les services op&eacute;rationnels
          </div>
          <div>&copy; TUR &mdash; Suite traiteur premium</div>
        </footer>
      </div>
    </div>
    </PrivacyModeProvider>
  );
}

function DashboardContent({ data }: { data: DashboardData }) {
  const KPIS = useMemo(() => [
    { label: "Chiffre d'affaires", value: data.revenue, prefix: "MAD", delta: data.health.monthlyGrowth, trend: data.health.monthlyGrowth >= 0 ? "up" as const : "down" as const, spark: data.perfRevenue, icon: Wallet, accent: true, sensitive: true },
    { label: "Commandes actives", value: data.activeCommandes, delta: 0, trend: "up" as const, spark: data.perfPayments, icon: Receipt, sensitive: true },
    { label: "\u00c9v\u00e9nements \u00e0 venir", value: data.upcomingEvents.length, delta: 0, trend: "up" as const, spark: data.perfEvents, icon: PartyPopper, sensitive: true },
    { label: "Clients actifs", value: data.activeClients, delta: 0, trend: "up" as const, spark: data.perfClients, icon: Users, sensitive: true },
    { label: "Acomptes en attente", value: data.pendingDeposits, prefix: "MAD", delta: 0, trend: "down" as const, spark: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, data.pendingDeposits > 0 ? 5 : 1], icon: Clock, sensitive: true },
    { label: "Paiements encaiss\u00e9s", value: data.paymentsReceived, prefix: "MAD", delta: 0, trend: "up" as const, spark: data.perfPayments, icon: Banknote, sensitive: true },
  ], [data]);

  return (
    <div className="mt-8 grid grid-cols-12 gap-6">
      <div className="col-span-12 xl:col-span-9 space-y-6">
        <KpiGrid kpis={KPIS} />
        <RevenueChart
          weekData={data.revenueWeek}
          weekLabels={data.revenueWeekLabels}
          monthData={data.revenueMonth}
          monthLabels={data.revenueMonthLabels}
          yearData={data.revenueYear}
          yearLabels={data.revenueYearLabels}
          total={data.revenue}
          growth={data.health.monthlyGrowth}
        />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3"><RecentCommandes commandes={data.recentCommandes} /></div>
          <div className="lg:col-span-2"><PaymentsCard paid={data.paymentsReceived} pending={data.pendingDeposits} remaining={data.totalBudget - data.paymentsReceived - data.pendingDeposits} /></div>
        </div>
        <UpcomingEvents events={data.upcomingEvents} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MiniCalendar />
          <BusinessHealth health={data.health} />
        </div>
        <QuickActions />
        <PerformanceCharts perfRevenue={data.perfRevenue} perfEvents={data.perfEvents} perfClients={data.perfClients} />
      </div>

      <DashboardSidebar
        todayEvents={data.todayEvents}
        alerts={data.alerts}
        activity={data.activity}
        quickStats={data.quickStats}
      />
    </div>
  );
}
