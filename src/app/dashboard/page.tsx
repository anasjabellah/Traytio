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
import { calcGrowth } from '@/features/dashboard/lib/calc-growth';
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
  const eventsDelta = calcGrowth(data.perfEvents);
  const clientsDelta = calcGrowth(data.perfClients);
  const paymentsDelta = calcGrowth(data.perfPayments);
  const eventsTotal = data.confirmedEvents + data.completedEvents;

  const KPIS = useMemo(() => [
    {
      label: "Chiffre d'affaires",
      value: data.revenue,
      prefix: "MAD",
      delta: data.health.monthlyGrowth,
      trend: data.health.monthlyGrowth >= 0 ? ("up" as const) : ("down" as const),
      spark: data.perfRevenue,
      icon: Wallet,
      sensitive: true,
    },
    {
      label: "Commandes actives",
      value: data.activeCommandes,
      delta: 0,
      trend: "up" as const,
      spark: data.perfRevenue,
      icon: Receipt,
      sensitive: true,
    },
    {
      label: "\u00c9v\u00e9nements",
      value: eventsTotal,
      delta: eventsDelta,
      trend: eventsDelta >= 0 ? ("up" as const) : ("down" as const),
      spark: data.perfEvents,
      icon: PartyPopper,
      sensitive: true,
    },
    {
      label: "Clients actifs",
      value: data.activeClients,
      delta: clientsDelta,
      trend: clientsDelta >= 0 ? ("up" as const) : ("down" as const),
      spark: data.perfClients,
      icon: Users,
      sensitive: true,
    },
    {
      label: "Acomptes en attente",
      value: data.pendingDeposits,
      prefix: "MAD",
      delta: 0,
      trend: "down" as const,
      spark: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, data.pendingDeposits > 0 ? 5 : 1],
      icon: Clock,
      sensitive: true,
    },
    {
      label: "Paiements encaiss\u00e9s",
      value: data.paymentsReceived,
      prefix: "MAD",
      delta: paymentsDelta,
      trend: paymentsDelta >= 0 ? ("up" as const) : ("down" as const),
      spark: data.perfPayments,
      icon: Banknote,
      sensitive: true,
    },
  ], [data, eventsTotal, eventsDelta, clientsDelta, paymentsDelta]);

  return (
      <div className="mt-8 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-9 space-y-6">
        <KpiGrid kpis={KPIS} />
        <RevenueChart
          weekData={data.weekAnalytics.weekData}
          weekLabels={data.weekAnalytics.weekLabels}
          weekTotal={data.weekAnalytics.weekTotal}
          weekGrowth={data.weekAnalytics.weekGrowth}
          revenueMaps={data.revenueMaps}
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
        <PerformanceCharts
          perfRevenue={data.perfRevenue}
          perfEvents={data.perfEvents}
          perfClients={data.perfClients}
          perfPayments={data.perfPayments}
          totalRevenue={data.revenue}
          confirmedEvents={data.confirmedEvents}
          upcomingEventsCount={data.upcomingEvents.length}
          activeClients={data.activeClients}
          paymentsReceived={data.paymentsReceived}
        />
      </div>

      <DashboardSidebar
        todayEvents={data.todayEvents}
        activity={data.activity}
        quickStats={data.quickStats}
      />
    </div>
  );
}
