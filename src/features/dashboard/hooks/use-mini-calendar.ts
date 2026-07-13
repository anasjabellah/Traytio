'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMonthEvents } from '@/features/dashboard/actions/get-month-events';
import type { CalendarEventData } from '@/features/dashboard/actions/get-month-events';

export const MONTH_EVENTS_QUERY_KEY = ['month-events'] as const;

export function useMiniCalendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);

  const query = useQuery<CalendarEventData[]>({
    queryKey: [...MONTH_EVENTS_QUERY_KEY, currentYear, currentMonth],
    queryFn: async () => {
      const res = await getMonthEvents(currentYear, currentMonth);
      if (res.success && res.data) return res.data;
      throw new Error(res.error || 'Erreur de chargement');
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const prevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 1) {
        setCurrentYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 12) {
        setCurrentYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  }, []);

  return {
    currentYear,
    currentMonth,
    events: query.data ?? [],
    loading: query.isLoading,
    prevMonth,
    nextMonth,
    refresh: () => query.refetch(),
  } as const;
}
