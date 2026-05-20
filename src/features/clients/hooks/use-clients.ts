'use client';

import { useState, useEffect, useCallback } from 'react';
import { getClients } from '@/features/clients/actions/get-clients';
import type { ClientWithStats, PaginatedClients } from '@/features/clients/types';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * useClients – custom hook to fetch client list with pagination & search.
 * Returns client list, loading state, error, pagination info, and handlers.
 */
export function useClients(initialLimit = 20) {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await getClients({
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (resp.success && resp.data) {
        const data = resp.data as PaginatedClients;
        setClients(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      } else {
        setError(resp.error ?? 'Failed to load clients');
      }
    } catch (e: any) {
      setError(e.message ?? 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  }, [search, pagination.page, pagination.limit]);

  // Initial load & refetch on deps change
  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const refresh = () => {
    fetch();
  };

  return {
    clients,
    isLoading,
    error,
    pagination,
    handleSearch,
    handlePageChange,
    refresh,
  } as const;
}
