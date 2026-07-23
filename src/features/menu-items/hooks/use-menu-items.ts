// src/features/menu-items/hooks/use-menu-items.ts
'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { getMenuItems } from '@/features/menu-items/actions/get-menu-items';
import { MENU_ITEM_DEFAULT_PAGE_SIZE } from '@/features/menu-items/constants';
import type { MenuItem } from '@/features/menu-items/types';
import { MENU_ITEM } from '@/lib/notify/messages';

type Pagination = { page: number; limit: number; total: number; totalPages: number };

export function useMenuItems(initialLimit = MENU_ITEM_DEFAULT_PAGE_SIZE, category?: string, isActive?: boolean) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: initialLimit, total: 0, totalPages: 0 });

  const fetchingRef = useRef(false);

  const handleLimitChange = useCallback((newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  }, []);

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
          setPagination(prev => ({ ...prev, total: d.total, totalPages: d.totalPages, page: prev.page - 1 }));
          return;
        }
        setItems(d.data);
        setPagination(prev => ({ ...prev, total: d.total, totalPages: d.totalPages }));
      } else {
        setError(resp.error ?? MENU_ITEM.FETCH_ERROR);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : MENU_ITEM.UNEXPECTED_ERROR);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [search, pagination.page, pagination.limit, category, isActive]);

  useEffect(() => {
    startTransition(() => { fetch(); });
  }, [fetch]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const refresh = useCallback(() => {
    fetchingRef.current = false;
    fetch();
  }, [fetch]);

  return {
    items, isLoading, error, pagination,
    handleSearch, handlePageChange, handleLimitChange, refresh,
  };
}
