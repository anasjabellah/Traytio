'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { getCommandesPage } from '@/features/commandes/actions/get-commandes-page';
import { COMMANDE } from '@/lib/notify/messages';
import type { Commande } from '@/features/commandes/types';
import type { CommandeStats, CommandesPageResult } from '@/features/commandes/actions/get-commandes-page';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function useCommandes(initialData?: CommandesPageResult | null) {
  const [commandes, setCommandes] = useState<Commande[]>(initialData?.commandes ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<CommandeStats | null>(initialData?.stats ?? null);

  const fetchingRef = useRef(false);
  const isInitialMount = useRef(true);

  const [search, setSearch] = useState<string>('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [eventType, setEventType] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: initialData?.page ?? 1,
    limit: initialData?.limit ?? 10,
    total: initialData?.total ?? 0,
    totalPages: initialData?.totalPages ?? 0,
  });

  const fetch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    const params = {
      search: search || undefined,
      status: statusFilters.length > 0 ? statusFilters : undefined,
      eventType: eventType || undefined,
      page: pagination.page,
      limit: pagination.limit,
    };
    try {
      const resp = await getCommandesPage(params);
      if (resp.success && resp.data) {
        if (resp.data.commandes.length === 0 && resp.data.page > 1) {
          setPagination(prev => ({
            ...prev,
            total: resp.data!.total,
            totalPages: resp.data!.totalPages,
            page: prev.page - 1,
          }));
          return;
        }
        setCommandes(resp.data.commandes);
        setDbStats(resp.data.stats);
        setPagination(prev => ({
          ...prev,
          total: resp.data!.total,
          totalPages: resp.data!.totalPages,
        }));
      } else {
        setError(resp.error ?? COMMANDE.FETCH_ERROR);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : COMMANDE.UNEXPECTED_ERROR);
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
    }
  }, [search, statusFilters, eventType, pagination.page, pagination.limit]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialData) return;
    }
    startTransition(() => { fetch(); });
  }, [fetch, initialData]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const toggleStatus = useCallback((status: string) => {
    setStatusFilters(prev => {
      if (prev.includes(status)) return prev.filter(s => s !== status);
      return [...prev, status];
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const clearStatusFilters = useCallback(() => {
    setStatusFilters([]);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleEventTypeFilter = useCallback((type: string | null) => {
    setEventType(type);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const refresh = useCallback(() => {
    fetchingRef.current = false;
    fetch();
  }, [fetch]);

  return {
    commandes, isLoading, error, pagination, search, statusFilters, eventType,
    handleSearch, toggleStatus, clearStatusFilters, handleEventTypeFilter,
    handlePageChange, handleLimitChange, refresh,
    dbStats,
  } as const;
}
