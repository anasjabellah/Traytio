'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { getRevenueAnalytics } from '@/features/dashboard/actions/get-revenue-analytics';

type RevenueData = {
  totalRevenue: number;
  growth: number;
  weekData: number[];
  weekLabels: string[];
  weekTotal: number;
  weekGrowth: number;
  monthData: number[];
  monthLabels: string[];
  monthTotal: number;
  monthGrowth: number;
  yearData: number[];
  yearLabels: string[];
  yearTotal: number;
  yearGrowth: number;
};

export function useRevenueAnalytics() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    startTransition(() => { setLoading(true); setError(null); });
    try {
      const res = await getRevenueAnalytics();
      if (res.success && res.data) {
        startTransition(() => { setData(res.data!); });
      } else {
        startTransition(() => { setError(res.error || 'Erreur de chargement'); });
      }
    } catch (err) {
      startTransition(() => { setError(err instanceof Error ? err.message : 'Erreur de chargement'); });
    } finally {
      startTransition(() => { setLoading(false); });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
