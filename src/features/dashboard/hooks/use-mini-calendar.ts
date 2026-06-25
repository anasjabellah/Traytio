'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { getMonthEvents } from '@/features/dashboard/actions/get-month-events';
import type { CalendarEventData } from '@/features/dashboard/actions/get-month-events';

export function useMiniCalendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [events, setEvents] = useState<CalendarEventData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMonthEvents(currentYear, currentMonth);
      if (res.success && res.data) {
        startTransition(() => setEvents(res.data!));
      }
    } catch {
      // silent
    } finally {
      startTransition(() => setLoading(false));
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const onFocus = () => fetchEvents();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchEvents]);

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

  const refresh = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { currentYear, currentMonth, events, loading, prevMonth, nextMonth, refresh } as const;
}
