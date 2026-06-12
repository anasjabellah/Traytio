'use client';

import { useState, useMemo } from 'react';
import type { Event } from '@/features/events/types';

export function useEventsFilters(events: Event[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  const filteredEvents = useMemo(() => {
    let result = events;
    if (statusFilter) result = result.filter(e => e.status === statusFilter);
    if (typeFilter) result = result.filter(e => e.type === typeFilter);
    if (paymentFilter) result = result.filter(e => e.paymentStatus === paymentFilter);
    if (dateFrom) result = result.filter(e => new Date(e.startDate) >= new Date(dateFrom));
    if (dateTo) result = result.filter(e => new Date(e.startDate) <= new Date(dateTo));
    if (budgetMin) result = result.filter(e => Number(e.budget ?? 0) >= Number(budgetMin));
    if (budgetMax) result = result.filter(e => Number(e.budget ?? 0) <= Number(budgetMax));
    return result;
  }, [events, statusFilter, typeFilter, paymentFilter, dateFrom, dateTo, budgetMin, budgetMax]);

  const resetFilters = () => {
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
    filteredEvents,
    resetFilters,
  };
}
