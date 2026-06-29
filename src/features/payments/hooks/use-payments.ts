// src/features/payments/hooks/use-payments.ts
'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { getPayments } from '@/features/payments/actions/get-payments';
import { PAYMENT_DEFAULT_PAGE_SIZE } from '@/features/payments/constants';
import type { PaymentWithCommande, PaymentStats } from '@/features/payments/types';

type Pagination = { page: number; limit: number; total: number; totalPages: number };

export function usePayments(initialLimit = PAYMENT_DEFAULT_PAGE_SIZE, method?: string, status?: string) {
  const [payments, setPayments] = useState<PaymentWithCommande[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
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
          setPagination(prev => ({ ...prev, total: d.total, totalPages: d.totalPages, page: prev.page - 1 }));
          return;
        }
        setPayments(d.data);
        setStats(d.stats);
        setPagination(prev => ({ ...prev, total: d.total, totalPages: d.totalPages }));
      } else {
        setError(result.error ?? 'Erreur');
      }
    } catch (e: any) {
      setError(e.message ?? 'Erreur inattendue');
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [search, pagination.page, pagination.limit, method, status]);

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
    payments, stats, isLoading, error, pagination,
    handleSearch, handlePageChange, handleLimitChange, refresh,
  };
}
