'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { PartyPopper, Calendar as CalendarIcon, CheckCircle2, Wallet, Users } from 'lucide-react';
import { getEventsPage } from '@/features/events/actions/get-events-page';
import type { Event } from '@/features/events/types';
import type { EventsPageStats, EventsPageAlert } from '@/features/events/actions/get-events-page';
import { EVENT_DEFAULT_PAGE_SIZE } from '@/features/events/constants';
import { computeKpi } from '@/features/dashboard/lib/kpi-engine';
import { useNotificationStore } from '@/stores/notification-store';
import { EVENT } from '@/lib/notify/messages';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type FilterParams = {
  status?: string | null;
  type?: string | null;
  dateFrom?: string;
  dateTo?: string;
  budgetMin?: string;
  budgetMax?: string;
};

export function useEvents(initialLimit = EVENT_DEFAULT_PAGE_SIZE, filterParams?: FilterParams) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<EventsPageStats | null>(null);
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [upcomingSorted, setUpcomingSorted] = useState<Event[]>([]);
  const [alerts, setAlerts] = useState<EventsPageAlert[]>([]);

  const fetchingRef = useRef(false);
  const [search, setSearch] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  const fetch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const resp = await getEventsPage({
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: filterParams?.status ?? undefined,
        type: filterParams?.type ?? undefined,
        dateFrom: filterParams?.dateFrom || undefined,
        dateTo: filterParams?.dateTo || undefined,
        budgetMin: filterParams?.budgetMin || undefined,
        budgetMax: filterParams?.budgetMax || undefined,
      });
      if (resp.success && resp.data) {
        const d = resp.data;
        if (d.events.length === 0 && d.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
          return;
        }
        setEvents(d.events);
        setStats(d.stats);
        setTodayEvents(d.todayEvents);
        setUpcomingSorted(d.upcomingSorted);
        setAlerts(d.alerts);
        setPagination(prev => ({ ...prev, total: d.total, totalPages: d.totalPages }));
      } else {
        setError(resp.error ?? EVENT.FETCH_ERROR);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : EVENT.UNEXPECTED_ERROR);
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
    }
  }, [search, pagination.page, pagination.limit, filterParams]);

  useEffect(() => {
    startTransition(() => { fetch(); });
  }, [fetch]);

  useEffect(() => {
    const setNotifications = useNotificationStore.getState().setNotifications;
    setNotifications(alerts);
  }, [alerts]);

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

  const totalKpi = computeKpi(stats?.perfTotal ?? []);
  const upcomingKpi = computeKpi(stats?.perfUpcoming ?? []);
  const confirmedKpi = computeKpi(stats?.perfConfirmed ?? []);
  const budgetKpi = computeKpi(stats?.perfBudget ?? []);
  const activeKpi = computeKpi(stats?.perfActive ?? []);

  const KPIS = [
    { label: "Total événements", value: stats?.totalEvents ?? 0, icon: PartyPopper, accent: true, sensitive: false, ...totalKpi },
    { label: "À venir", value: stats?.upcomingEvents ?? 0, icon: CalendarIcon, sensitive: false, ...upcomingKpi },
    { label: "Confirmés", value: stats?.confirmedEvents ?? 0, icon: CheckCircle2, sensitive: true, ...confirmedKpi },
    { label: "Budget total", value: stats?.totalBudget ?? 0, prefix: "MAD", icon: Wallet, sensitive: true, ...budgetKpi },
    { label: "Clients actifs", value: stats?.activeClients ?? 0, icon: Users, sensitive: false, ...activeKpi },
  ];

  const STATS_EVENTS = [
    { label: "Budget moyen", value: stats?.avgBudget ?? 0 },
    { label: "Événements mensuels", value: stats?.thisMonthEvents ?? 0 },
  ];

  const totalBudget = stats?.totalBudget ?? 0;

  return {
    events,
    isLoading,
    error,
    pagination,
    handleSearch,
    handlePageChange,
    handleLimitChange,
    refresh,
    stats,
    KPIS,
    todayEvents,
    upcomingSorted,
    alerts,
    STATS_EVENTS,
    totalBudget,
  } as const;
}
