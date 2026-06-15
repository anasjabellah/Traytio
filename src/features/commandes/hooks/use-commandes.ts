'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCommandes } from '@/features/commandes/actions/get-commandes';
import type { Commande, PaginatedCommandes } from '@/features/commandes/types';

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

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
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
      const resp = await getCommandes({
        search: search || undefined,
        status: statusFilter || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (resp.success && resp.data) {
        const data = resp.data as PaginatedCommandes;
        setCommandes(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      } else {
        setError(resp.error ?? 'Failed to load commandes');
      }
    } catch (e: any) {
      setError(e.message ?? 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetch();
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
    commandes,
    isLoading,
    error,
    pagination,
    search,
    statusFilter,
    handleSearch,
    handleStatusFilter,
    handlePageChange,
    refresh,
  } as const;
}
