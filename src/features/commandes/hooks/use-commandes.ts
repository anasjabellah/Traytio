'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { getCommandesPage } from '@/features/commandes/actions/get-commandes-page';
import type { Commande } from '@/features/commandes/types';
import type { CommandeStats } from '@/features/commandes/actions/get-commandes-page';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function useCommandes(initialLimit = 10) {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<CommandeStats | null>(null);

  const fetchingRef = useRef(false);

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
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
    const params = {
      search: search || undefined,
      status: statusFilter || undefined,
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
        setError(resp.error ?? 'Failed to load commandes');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
    }
  }, [search, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    startTransition(() => { fetch(); });
  }, [fetch]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleStatusFilter = useCallback((status: string | null) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const refresh = () => {
    fetch();
  };

  return {
    commandes, isLoading, error, pagination, search, statusFilter,
    handleSearch, handleStatusFilter, handlePageChange, refresh,
    dbStats,
  } as const;
}
