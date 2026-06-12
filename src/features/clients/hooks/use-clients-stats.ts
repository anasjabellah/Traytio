'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users, CheckCircle2, Wallet, UserPlus, ShoppingCart } from 'lucide-react';
import { getClientStats } from '@/features/clients/actions/get-client-stats';
import { getClientActivity } from '@/features/clients/actions/get-client-activity';
import type { ClientWithStats } from '@/features/clients/types';
import type { ClientStats } from '@/features/clients/actions/get-client-stats';
import type { ActivityItem } from '@/features/clients/actions/get-client-activity';

export const SPARK_DEFAULTS: Record<string, number[]> = {
  up: [2, 3, 4, 3, 5, 4, 6],
  down: [5, 4, 3, 4, 2, 3, 2],
  steady: [3, 3, 4, 4, 3, 4, 4],
};

export function useCounter(target: number, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function useClientsStats(clients: ClientWithStats[], totalClientsFromPagination: number) {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    getClientStats().then(setStats);
    getClientActivity().then(setActivities);
  }, []);

  const totalClients = totalClientsFromPagination;
  const activeClientsCount = stats?.activeClients ?? clients.filter(c =>
    c.lastOrderAt && new Date(c.lastOrderAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  ).length;
  const totalRevenue = stats?.totalRevenue ?? clients.reduce((s, c) => s + Number(c.totalSpent), 0);
  const avgValue = stats?.averageValue ?? (totalClients > 0 ? totalRevenue / totalClients : 0);
  const newClients30d = stats?.newClients30d ?? clients.filter(c =>
    new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;
  const activePct = totalClients > 0 ? Math.round((activeClientsCount / totalClients) * 100) : 0;
  const totalCommandes = stats?.totalCommandes ?? clients.reduce((s, c) => s + c.commandesCount, 0);

  const KPIS = [
    { label: "Total Clients", value: totalClients, delta: stats?.growthRate ?? 0, trend: (stats?.growthRate ?? 0) >= 0 ? 'up' as const : 'down' as const, spark: SPARK_DEFAULTS.up, icon: Users, accent: true },
    { label: "Clients Actifs", value: activeClientsCount, delta: activePct, trend: activePct >= 50 ? 'up' as const : 'down' as const, spark: SPARK_DEFAULTS.steady, icon: CheckCircle2 },
    { label: "Chiffre d'Affaires", value: totalRevenue, prefix: "MAD", delta: stats ? Math.round((totalRevenue / Math.max(stats.totalRevenue || totalRevenue, 1)) * 100) : 0, trend: 'up' as const, spark: SPARK_DEFAULTS.up, icon: Wallet, accent: true },
    { label: "Nouveaux (30j)", value: newClients30d, delta: stats ? Math.round((newClients30d / Math.max(stats.newClients30d || newClients30d, 1)) * 100) : 0, trend: newClients30d > 0 ? 'up' as const : 'down' as const, spark: SPARK_DEFAULTS.up, icon: UserPlus },
    { label: "Commandes", value: totalCommandes, delta: 0, trend: totalCommandes > 0 ? 'up' as const : 'down' as const, spark: SPARK_DEFAULTS.up, icon: ShoppingCart },
  ];

  const recentClients = useMemo(() =>
    [...clients]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  [clients]);

  const topCity = stats?.topCity ?? (() => {
    const map = new Map<string, number>();
    for (const c of clients) { if (c.city) map.set(c.city, (map.get(c.city) || 0) + 1); }
    let best = '', bestCount = 0;
    for (const [city, count] of map) { if (count > bestCount) { best = city; bestCount = count; } }
    return best || '—';
  })();

  return {
    stats, activities,
    totalClients, activeClientsCount, totalRevenue, avgValue, newClients30d, activePct, totalCommandes,
    KPIS, recentClients, topCity,
  };
}
