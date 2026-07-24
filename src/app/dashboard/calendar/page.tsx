import { getEvents } from '@/features/events/actions/get-events'
import CalendarPageClient from './calendar-page-client'

function getInitialDateRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

export default async function Page() {
  try {
    const range = getInitialDateRange()
    const result = await getEvents({ dateFrom: range.from, dateTo: range.to, limit: 500 })

    if (result.success && result.data) {
      return (
        <CalendarPageClient
          initialData={{
            events: result.data.data,
            perfData: {
              perfTotal: result.data.perfTotal,
              perfWeek: result.data.perfWeek,
              perfMonth: result.data.perfMonth,
              perfBudget: result.data.perfBudget,
              perfPayments: result.data.perfPayments,
            },
            dateRange: range,
          }}
        />
      )
    }
  } catch {
    // Fallback to client-only fetch
  }

  return <CalendarPageClient />
}
