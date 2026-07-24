'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { getPayments } from '@/features/payments/actions/get-payments';
import { PAYMENT } from '@/lib/notify/messages';
import { PAYMENT_DEFAULT_PAGE_SIZE } from '@/features/payments/constants';
import type { PaymentWithCommande, PaymentStats, PaginatedPayments } from '@/features/payments/types';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function usePayments(
  initialData?: PaginatedPayments | null,
  method?: string,
  status?: string,
) {
  const [payments, setPayments] = useState<PaymentWithCommande[]>(initialData?.data ?? []);
  const [stats, setStats] = useState<PaymentStats | null>(initialData?.stats ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const isInitialMount = useRef(true);

  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: initialData?.page ?? 1,
    limit: initialData?.limit ?? PAYMENT_DEFAULT_PAGE_SIZE,
    total: initialData?.total ?? 0,
    totalPages: initialData?.totalPages ?? 0,
  });

  const fetch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getPayments({
        search: search || undefined,
        method,
        status,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (result.success && result.data) {
        const d = result.data;
        if (d.data.length === 0 && d.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
          return;
        }
        setPayments(d.data);
        setStats(d.stats);
        setPagination(prev => ({ ...prev, total: d.total, totalPages: d.totalPages }));
      } else {
        setError(result.error ?? PAYMENT.ERROR_GENERIC);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : PAYMENT.UNEXPECTED_ERROR);
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
    }
  }, [search, pagination.page, pagination.limit, method, status]);

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
    payments, stats, isLoading, error, pagination,
    handleSearch, handlePageChange, handleLimitChange, refresh,
  } as const;
}
