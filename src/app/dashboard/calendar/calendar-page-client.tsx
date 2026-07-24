'use client'

import { CalendarPage } from '@/features/calendar/components/CalendarPage'
import type { CalendarInitialData } from '@/features/calendar/hooks/use-calendar-data'

export default function CalendarPageClient({
  initialData,
}: {
  initialData?: CalendarInitialData | null
}) {
  return <CalendarPage initialData={initialData} />
}
