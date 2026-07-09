'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { getMenus } from '@/features/menus/actions/get-menus';
import { MENU_DEFAULT_PAGE_SIZE } from '@/features/menus/constants';
import type { Menu } from '@/features/menus/types';
import { MENU } from '@/lib/notify/messages';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function useMenus(
  initialLimit = MENU_DEFAULT_PAGE_SIZE,
  category?: string,
  isActive?: boolean | undefined,
) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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
      const resp = await getMenus({
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
        category: category || undefined,
        isActive: isActive,
      });
      if (resp.success && resp.data) {
        const d = resp.data;
        if (d.data.length === 0 && d.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
          return;
        }
        setMenus(d.data);
        setPagination(prev => ({
          ...prev,
          total: d.total,
          totalPages: d.totalPages,
        }));
      } else {
        setError(resp.error ?? MENU.FETCH_ERROR);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : MENU.UNEXPECTED_ERROR);
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
    }
  }, [search, pagination.page, pagination.limit, category, isActive]);

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

  const refresh = useCallback(() => {
    fetch();
  }, [fetch]);

  return {
    menus,
    isLoading,
    error,
    pagination,
    handleSearch,
    handlePageChange,
    handleLimitChange,
    refresh,
  } as const;
}
