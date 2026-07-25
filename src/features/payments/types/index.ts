export type PaymentWithCommande = {
  id: string;
  amount: number;
  method: string;
  status: string;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
  commande: {
    id: string;
    number: string;
    clientName: string | null;
  };
};

export type PaymentStats = {
  totalCollected: number;
  totalRefunded: number;
  monthlyRevenue: number;
  pendingCount: number;
  previousMonthRevenue: number;
  perfCollected: number[];
  perfRevenue: number[];
  perfRefunded: number[];
  perfPending: number[];
  todayPayments: { count: number; total: number };
  methodBreakdown: Array<{ method: string; count: number; total: number }>;
  quickStats: { averageAmount: number; largestPayment: number; completedCount: number; pendingCount: number; refundedCount: number };
  completedCount: number;
  refundedCount: number;
  largestPayment: number;
  insights: string[];
};

export type GetPaymentsParams = {
  search?: string;
  method?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export type PaginatedPayments = {
  data: PaymentWithCommande[];
  stats: PaymentStats;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};
