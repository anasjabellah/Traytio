'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { getEvents } from '@/features/events/actions/get-events'
import type { Event } from '@/features/events/types'

export type CalendarFilters = {
  status?: string
  type?: string
  search?: string
}

export type CalendarStats = {
  totalEvents: number
  thisWeek: number
  thisMonth: number
  totalBudget: number
  totalPaid: number
}

function getDefaultMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return {
    from: start.toLocaleDateString('en-CA'),
    to: end.toLocaleDateString('en-CA'),
  }
}

export function useCalendarData() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<CalendarFilters>({})
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(getDefaultMonthRange)
  const mounted = useRef(false)



  const fetchEvents = useCallback(
    async (from: string, to: string, currentFilters: CalendarFilters) => {
      setLoading(true)
      setError(null)

      const result = await getEvents({
        dateFrom: from,
        dateTo: to,
        limit: 500,
        status: currentFilters.status as Event['status'],
        type: currentFilters.type as Event['type'],
        search: currentFilters.search,
      })

      if (!mounted.current) return

      if (result.success && result.data) {
        setEvents(result.data.data)
      } else {
        setError(result.error || 'Erreur lors du chargement')
        setEvents([])
      }
      setLoading(false)
    },
    [],
  )

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (dateRange) {
      fetchEvents(dateRange.from, dateRange.to, filters)
    }
  }, [dateRange?.from, dateRange?.to, filters.status, filters.type, filters.search, fetchEvents])

  useEffect(() => {
    const handleFocus = () => {
      if (dateRange) fetchEvents(dateRange.from, dateRange.to, filters)
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [dateRange, filters, fetchEvents])

  const appliedFilters = useMemo(() => {
    return events.filter((e) => {
      if (filters.status && e.status !== filters.status) return false
      if (filters.type && e.type !== filters.type) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const matchesName = e.name.toLowerCase().includes(q)
        const matchesClient = e.clientName?.toLowerCase().includes(q)
        const matchesLocation = e.location?.toLowerCase().includes(q)
        if (!matchesName && !matchesClient && !matchesLocation) return false
      }
      return true
    })
  }, [events, filters])

  const stats: CalendarStats = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const thisWeek = appliedFilters.filter((e) => {
      const d = new Date(e.startDate)
      return d >= startOfWeek && d <= endOfWeek
    })
    const thisMonth = appliedFilters.filter((e) => {
      const d = new Date(e.startDate)
      return d >= startOfMonth && d <= endOfMonth
    })

    return {
      totalEvents: appliedFilters.length,
      thisWeek: thisWeek.length,
      thisMonth: thisMonth.length,
      totalBudget: appliedFilters.reduce((sum, e) => sum + (e.budget || 0), 0),
      totalPaid: appliedFilters.reduce((sum, e) => sum + (e.totalPaid || 0), 0),
    }
  }, [appliedFilters])

  const refresh = useCallback(() => {
    if (dateRange) {
      fetchEvents(dateRange.from, dateRange.to, filters)
    }
  }, [dateRange, filters, fetchEvents])

  return {
    events: appliedFilters,
    allEvents: events,
    loading,
    error,
    stats,
    filters,
    setFilters,
    dateRange,
    setDateRange,
    refresh,
  }
}
