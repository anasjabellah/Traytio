'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEvents } from '@/features/events/actions/get-events';
import type { Event, PaginatedEvents } from '@/features/events/types';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * useEvents – custom hook to fetch event list with pagination & search.
 * Returns event list, loading state, error, pagination info, and handlers.
 */
export function useEvents(initialLimit = 20) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
      const resp = await getEvents({
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (resp.success && resp.data) {
        const data = resp.data as PaginatedEvents;
        setEvents(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      } else {
        setError(resp.error ?? 'Failed to load events');
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
    events,
    isLoading,
    error,
    pagination,
    handleSearch,
    handlePageChange,
    refresh,
  } as const;
}