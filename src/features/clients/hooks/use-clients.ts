'use client';

import { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react';
import { Users, CheckCircle2, Wallet, UserPlus, ShoppingCart } from 'lucide-react';
import { getClientsPage } from '@/features/clients/actions/get-clients-page';
import { CLIENT_DEFAULT_PAGE_SIZE } from '@/features/clients/constants';
import { CLIENT } from '@/lib/notify/messages';
import { computeKpi } from '@/features/dashboard/lib/kpi-engine';
import type { ClientWithStats } from '@/features/clients/types';
import type { ClientStats, ActivityItem, GetClientsPageParams } from '@/features/clients/actions/get-clients-page';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
        setError(resp.error ?? CLIENT.FETCH_ERROR);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : CLIENT.UNEXPECTED_ERROR);
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

  const totalKpi = useMemo(() => computeKpi(stats?.perfTotal ?? []), [stats?.perfTotal]);
  const activeKpi = useMemo(() => computeKpi(stats?.perfActive ?? []), [stats?.perfActive]);
  const revenueKpi = useMemo(() => computeKpi(stats?.perfRevenue ?? []), [stats?.perfRevenue]);
  const new30dKpi = useMemo(() => computeKpi(stats?.perfNew30d ?? []), [stats?.perfNew30d]);
  const commandesKpi = useMemo(() => computeKpi(stats?.perfCommandes ?? []), [stats?.perfCommandes]);

  const KPIS = [
    { label: "Total Clients", value: totalClients, icon: Users, accent: true, sensitive: true, ...totalKpi },
    { label: "Clients Actifs", value: activeClientsCount, icon: CheckCircle2, sensitive: true, ...activeKpi },
    { label: "Chiffre d'Affaires", value: totalRevenue, prefix: 'MAD', icon: Wallet, accent: true, sensitive: true, ...revenueKpi },
    { label: "Nouveaux (30j)", value: newClients30d, icon: UserPlus, sensitive: true, ...new30dKpi },
    { label: "Commandes", value: totalCommandes, icon: ShoppingCart, sensitive: true, ...commandesKpi },
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
