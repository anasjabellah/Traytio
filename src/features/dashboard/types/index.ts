export type DashboardData = {
  revenue: number;
  totalBudget: number;
  activeClients: number;
  confirmedEvents: number;
  completedEvents: number;
  activeCommandes: number;
  paymentsReceived: number;
  pendingDeposits: number;
  recentCommandes: Array<{
    id: string; number: string; clientName: string;
    date: Date; total: number; status: string;
  }>;
  upcomingEvents: Array<{
    id: string; name: string; clientName: string | null;
    startDate: Date; guestCount: number | null; status: string;
  }>;
  todayEvents: Array<{
    id: string; name: string; startDate: Date; guestCount: number | null;
  }>;
  activity: Array<{
    who: string; action: string; target: string; time: string; financial: boolean;
  }>;
  health: {
    avgEventValue: number;
    avgDeposit: number;
    topMenuItem: string | null;
    topMenuCount: number | null;
    bestClientName: string | null;
    bestClientTotal: number | null;
    monthlyGrowth: number;
  };
  quickStats: {
    avgBudget: number;
    avgGuests: number;
    completionRate: number;
  };
  revenueMaps: {
    daily: Record<string, number>;
    monthly: Record<string, number>;
    paidMonthly: Record<string, number>;
  };
  weekAnalytics: {
    weekData: number[];
    weekLabels: string[];
    weekTotal: number;
    weekGrowth: number;
  };
  perfRevenue: number[];
  perfEvents: number[];
  perfClients: number[];
  perfPayments: number[];
};
