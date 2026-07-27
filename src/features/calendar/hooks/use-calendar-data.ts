'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { getEvents } from '@/features/events/actions/get-events'
import type { Event } from '@/features/events/types'

export type CalendarFilters = {
  status?: string
  type?: string
  search?: string
  paymentStatus?: string
  dateFrom?: string
  dateTo?: string
  budgetMin?: number
  budgetMax?: number
}

export type CalendarStats = {
  totalEvents: number
  thisWeek: number
  thisMonth: number
  totalBudget: number
  totalPaid: number
  perfTotal: number[]
  perfWeek: number[]
  perfMonth: number[]
  perfBudget: number[]
  perfPayments: number[]
}

export type CalendarInitialData = {
  events: Event[]
  perfData: {
    perfTotal: number[]
    perfWeek: number[]
    perfMonth: number[]
    perfBudget: number[]
    perfPayments: number[]
  }
  dateRange: { from: string; to: string }
}

export function useCalendarData(initialData?: CalendarInitialData | null) {
  const [events, setEvents] = useState<Event[]>(initialData?.events ?? [])
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<CalendarFilters>({})
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(
    initialData?.dateRange ?? null,
  )
  const [everHadEvents, setEverHadEvents] = useState(
    initialData ? initialData.events.length > 0 : false,
  )
  const [perfData, setPerfData] = useState<{
    perfTotal: number[]
    perfWeek: number[]
    perfMonth: number[]
    perfBudget: number[]
    perfPayments: number[]
  } | null>(initialData?.perfData ?? null)
  const mounted = useRef(false)
  const fetchingRef = useRef(false)
  const lastFetchedKey = useRef(
    initialData
      ? `${initialData.dateRange.from}|${initialData.dateRange.to}|${JSON.stringify({})}`
      : '',
  )

  const fetchEvents = useCallback(
    async (from: string, to: string, currentFilters: CalendarFilters) => {
      const key = `${from}|${to}|${JSON.stringify(currentFilters)}`
      if (key === lastFetchedKey.current) return
      if (fetchingRef.current) return
      fetchingRef.current = true
      lastFetchedKey.current = key
      setLoading(true)
      setError(null)

      try {
        const result = await getEvents({
          dateFrom: from,
          dateTo: to,
          limit: 500,
          status: currentFilters.status as Event['status'],
          type: currentFilters.type as Event['type'],
          search: currentFilters.search,
          paymentStatus: currentFilters.paymentStatus as Event['paymentStatus'],
          budgetMin: currentFilters.budgetMin,
          budgetMax: currentFilters.budgetMax,
        })

        if (!mounted.current) return

        if (result.success && result.data) {
          setEvents(result.data.data)
          setPerfData({
            perfTotal: result.data.perfTotal,
            perfWeek: result.data.perfWeek,
            perfMonth: result.data.perfMonth,
            perfBudget: result.data.perfBudget,
            perfPayments: result.data.perfPayments,
          })
          if (result.data.data.length > 0) setEverHadEvents(true)
        } else {
          setError(result.error || 'Erreur lors du chargement')
          setEvents([])
        }
      } catch {
        if (mounted.current) {
          setError('Erreur lors du chargement')
          setEvents([])
        }
      } finally {
        fetchingRef.current = false
        setLoading(false)
      }
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
  }, [dateRange?.from, dateRange?.to, filters.status, filters.type, filters.search, filters.paymentStatus, filters.dateFrom, filters.dateTo, filters.budgetMin, filters.budgetMax, fetchEvents])

  useEffect(() => {
    const handleFocus = () => {
      if (dateRange) {
        lastFetchedKey.current = ''
        fetchEvents(dateRange.from, dateRange.to, filters)
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [dateRange?.from, dateRange?.to, filters.status, filters.type, filters.search, filters.paymentStatus, filters.dateFrom, filters.dateTo, filters.budgetMin, filters.budgetMax, fetchEvents])

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
      perfTotal: perfData?.perfTotal ?? [],
      perfWeek: perfData?.perfWeek ?? [],
      perfMonth: perfData?.perfMonth ?? [],
      perfBudget: perfData?.perfBudget ?? [],
      perfPayments: perfData?.perfPayments ?? [],
    }
  }, [appliedFilters, perfData])

  const refresh = useCallback(() => {
    if (dateRange) {
      lastFetchedKey.current = ''
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
    everHadEvents,
  }
}
