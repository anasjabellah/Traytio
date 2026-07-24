'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { getMenuItems } from '@/features/menu-items/actions/get-menu-items';
import { MENU_ITEM_DEFAULT_PAGE_SIZE } from '@/features/menu-items/constants';
import type { MenuItem, PaginatedMenuItems } from '@/features/menu-items/types';
import { MENU_ITEM } from '@/lib/notify/messages';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function useMenuItems(
  initialData?: PaginatedMenuItems | null,
  category?: string,
  isActive?: boolean | undefined,
) {
  const [items, setItems] = useState<MenuItem[]>(initialData?.data ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const isInitialMount = useRef(true);

  const [search, setSearch] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({
    page: initialData?.page ?? 1,
    limit: initialData?.limit ?? MENU_ITEM_DEFAULT_PAGE_SIZE,
    total: initialData?.total ?? 0,
    totalPages: initialData?.totalPages ?? 0,
  });

  const fetch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const resp = await getMenuItems({
        search: search || undefined,
        category: category,
        isActive: isActive,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (resp.success && resp.data) {
        const d = resp.data;
        if (d.data.length === 0 && d.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
          return;
        }
        setItems(d.data);
        setPagination(prev => ({
          ...prev,
          total: d.total,
          totalPages: d.totalPages,
        }));
      } else {
        setError(resp.error ?? MENU_ITEM.FETCH_ERROR);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : MENU_ITEM.UNEXPECTED_ERROR);
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
    }
  }, [search, pagination.page, pagination.limit, category, isActive]);

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
    items, isLoading, error, pagination,
    handleSearch, handlePageChange, handleLimitChange, refresh,
  } as const;
}
