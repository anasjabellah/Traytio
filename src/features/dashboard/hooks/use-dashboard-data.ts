'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/features/dashboard/actions/get-dashboard-stats';
import type { DashboardData } from '@/features/dashboard/types';

export const DASHBOARD_QUERY_KEY = ['dashboard'] as const;

export function useDashboardData() {
  const query = useQuery<DashboardData>({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: async () => {
      const res = await getDashboardData();
      if (res.success && res.data) return res.data;
      throw new Error(res.error || 'Erreur de chargement');
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refresh: () => query.refetch(),
  };
}
