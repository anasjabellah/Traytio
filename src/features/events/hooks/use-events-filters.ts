'use client';

import { useState, useMemo } from 'react';
import type { FilterParams } from '@/features/events/hooks/use-events';

export function useEventsFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  const filterParams: FilterParams = useMemo(() => ({
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(budgetMin ? { budgetMin } : {}),
    ...(budgetMax ? { budgetMax } : {}),
  }), [statusFilter, typeFilter, dateFrom, dateTo, budgetMin, budgetMax]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter(null);
    setTypeFilter(null);
    setPaymentFilter(null);
    setDateFrom('');
    setDateTo('');
    setBudgetMin('');
    setBudgetMax('');
  };

  return {
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    paymentFilter, setPaymentFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    budgetMin, setBudgetMin,
    budgetMax, setBudgetMax,
    filterParams,
    resetFilters,
  };
}
