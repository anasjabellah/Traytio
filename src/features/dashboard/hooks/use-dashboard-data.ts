'use client';

import { useState, useEffect } from 'react';
import { getDashboardData } from '@/features/dashboard/actions/get-dashboard-stats';
import type { DashboardData } from '@/features/dashboard/types';

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardData().then((res) => {
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Erreur de chargement');
      }
      setLoading(false);
    });
  }, []);

  return { data, loading, error };
}
