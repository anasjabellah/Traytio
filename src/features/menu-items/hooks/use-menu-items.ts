'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMenuItems } from '@/features/menu-items/actions/get-menu-items';
import type { MenuItem, PaginatedMenuItems } from '@/features/menu-items/types';

type Pagination = { page: number; limit: number; total: number; totalPages: number };

export function useMenuItems(initialLimit = 20) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: initialLimit, total: 0, totalPages: 0 });

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await getMenuItems({ search: search || undefined, page: pagination.page, limit: pagination.limit });
      if (resp.success && resp.data) {
        const data = resp.data as PaginatedMenuItems;
        setItems(data.data);
        setPagination(prev => ({ ...prev, total: data.total, totalPages: data.totalPages }));
      } else {
        setError(resp.error ?? 'Erreur');
      }
    } catch (e: any) {
      setError(e.message ?? 'Erreur inattendue');
    } finally {
      setIsLoading(false);
    }
  }, [search, pagination.page, pagination.limit]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleSearch = useCallback((q: string) => { setSearch(q); setPagination(prev => ({ ...prev, page: 1 })); }, []);
  const handlePageChange = (page: number) => setPagination(prev => ({ ...prev, page }));
  const refresh = () => loadItems();

  return { items, isLoading, error, pagination, handleSearch, handlePageChange, refresh };
}