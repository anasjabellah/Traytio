'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMenus } from '@/features/menus/actions/get-menus';
import type { Menu, PaginatedMenus } from '@/features/menus/types';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function useMenus(initialLimit = 20) {
  const [menus, setMenus] = useState<Menu[]>([]);
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
      const resp = await getMenus({
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (resp.success && resp.data) {
        const data = resp.data as PaginatedMenus;
        setMenus(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      } else {
        setError(resp.error ?? 'Failed to load menus');
      }
    } catch (e: any) {
      setError(e.message ?? 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  }, [search, pagination.page, pagination.limit]);

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
    menus,
    isLoading,
    error,
    pagination,
    handleSearch,
    handlePageChange,
    refresh,
  } as const;
}
