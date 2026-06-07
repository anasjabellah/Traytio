export type DashboardData = {
  revenue: number;
  totalBudget: number;
  activeClients: number;
  eventsThisMonth: number;
  activeCommandes: number;
  paymentsReceived: number;
  pendingDeposits: number;
  revenueWeek: number[];
  revenueWeekLabels: string[];
  revenueMonth: number[];
  revenueMonthLabels: string[];
  revenueYear: number[];
  revenueYearLabels: string[];
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
  alerts: Array<{
    type: 'warn' | 'info' | 'danger';
    title: string; text: string;
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
  perfRevenue: number[];
  perfEvents: number[];
  perfClients: number[];
  perfPayments: number[];
};
