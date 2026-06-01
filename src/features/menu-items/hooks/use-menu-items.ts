// src/features/menu-items/hooks/use-menu-items.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMenuItems } from '@/features/menu-items/actions/get-menu-items';
import type { MenuItem, PaginatedMenuItems } from '@/features/menu-items/types';

type Pagination = { page: number; limit: number; total: number; totalPages: number };

// Add category state
export function useMenuItems(initialLimit = 20) {
  const [category, setCategory] = useState('ALL'); // New state for category filter
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: initialLimit, total: 0, totalPages: 0 });

  // Load items with category filter
  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pass category as query param
      const resp = await getMenuItems({
        search: search || undefined,
        category: category, // Add category to parameters
        page: pagination.page,
        limit: pagination.limit
      });
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
  }, [search, pagination.page, pagination.limit, category]); // Add category to dependencies

  useEffect(() => { loadItems(); }, [loadItems]);

  // Handle search (already exists)
  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle category change (new)
  const handleCategoryChange = (c: string) => {
    setCategory(c);
    setSearch(''); // Reset search when filtering
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // handlePageChange and refresh remain unchanged
  const handlePageChange = (page: number) => setPagination(prev => ({ ...prev, page }));
  const refresh = () => loadItems();

  return {
    items, isLoading, error, pagination,
    handleSearch, handlePageChange, refresh,
    handleCategoryChange // Export category handler
  };
}