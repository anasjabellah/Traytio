'use client';

import { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react';
import { Users, CheckCircle2, Wallet, UserPlus, ShoppingCart } from 'lucide-react';
import { getClientsPage } from '@/features/clients/actions/get-clients-page';
import { CLIENT_DEFAULT_PAGE_SIZE } from '@/features/clients/constants';
import type { ClientWithStats } from '@/features/clients/types';
import type { ClientStats, ActivityItem, GetClientsPageParams } from '@/features/clients/actions/get-clients-page';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const SPARK_DEFAULTS: Record<string, number[]> = {
  up: [2, 3, 4, 3, 5, 4, 6],
  down: [5, 4, 3, 4, 2, 3, 2],
  steady: [3, 3, 4, 4, 3, 4, 4],
};

type KpiItem = {
  label: string;
  value: number;
  delta: number;
  trend: 'up' | 'down';
  spark: number[];
  icon: React.ComponentType<{ className?: string }>;
  prefix?: string;
  accent?: boolean;
  sensitive?: boolean;
};

export function useClients(initialLimit = CLIENT_DEFAULT_PAGE_SIZE, sortBy?: string) {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const fetchingRef = useRef(false);

  const [search, setSearch] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  const sortOrder = sortBy === 'name' ? 'asc' : 'desc';

  const fetch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const resp = await getClientsPage({
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: (sortBy || 'createdAt') as GetClientsPageParams['sortBy'],
        sortOrder,
      });
      if (resp.success && resp.data) {
        const d = resp.data;
        if (d.clients.length === 0 && d.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
          return;
        }
        setClients(d.clients);
        setStats(d.stats);
        setActivity(d.activity);
        setPagination(prev => ({ ...prev, total: d.total, totalPages: d.totalPages }));
      } else {
        setError(resp.error ?? 'Failed to load clients');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
    }
  }, [search, pagination.page, pagination.limit, sortBy, sortOrder]);

  useEffect(() => {
    startTransition(() => { fetch(); });
  }, [fetch]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const refresh = () => {
    fetch();
  };

  // ── Derived KPIs (server values with safe fallbacks) ──
  const totalClients = pagination.total;
  const activeClientsCount = stats?.activeClients ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const avgValue = stats?.averageValue ?? 0;
  const newClients30d = stats?.newClients30d ?? 0;
  const activePct = totalClients > 0 ? Math.round((activeClientsCount / totalClients) * 100) : 0;
  const totalCommandes = stats?.totalCommandes ?? 0;

  const KPIS: KpiItem[] = [
    { label: "Total Clients", value: totalClients, delta: stats?.growthRate ?? 0, trend: (stats?.growthRate ?? 0) >= 0 ? 'up' : 'down', spark: SPARK_DEFAULTS.up, icon: Users, accent: true, sensitive: true },
    { label: "Clients Actifs", value: activeClientsCount, delta: activePct, trend: activePct >= 50 ? 'up' : 'down', spark: SPARK_DEFAULTS.steady, icon: CheckCircle2, sensitive: true },
    { label: "Chiffre d'Affaires", value: totalRevenue, delta: stats ? Math.round((totalRevenue / Math.max(stats.totalRevenue || totalRevenue, 1)) * 100) : 0, trend: 'up', spark: SPARK_DEFAULTS.up, icon: Wallet, accent: true, prefix: 'MAD', sensitive: true },
    { label: "Nouveaux (30j)", value: newClients30d, delta: stats ? Math.round((newClients30d / Math.max(stats.newClients30d || newClients30d, 1)) * 100) : 0, trend: newClients30d > 0 ? 'up' : 'down', spark: SPARK_DEFAULTS.up, icon: UserPlus, sensitive: true },
    { label: "Commandes", value: totalCommandes, delta: 0, trend: totalCommandes > 0 ? 'up' : 'down', spark: SPARK_DEFAULTS.up, icon: ShoppingCart, sensitive: true },
  ];

  const recentClients = useMemo(() =>
    [...clients]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  [clients]);

  const topCity = stats?.topCity ?? '—';

  return {
    clients, isLoading, error, pagination, stats, activity,
    handleSearch, handlePageChange, handleLimitChange, refresh,
    totalClients, activeClientsCount, totalRevenue, avgValue,
    newClients30d, activePct, totalCommandes,
    KPIS, recentClients, topCity,
  } as const;
}
