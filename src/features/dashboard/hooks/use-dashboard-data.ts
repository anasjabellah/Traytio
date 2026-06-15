'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDashboardData } from '@/features/dashboard/actions/get-dashboard-stats';
import type { DashboardData } from '@/features/dashboard/types';

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardData();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Erreur de chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
