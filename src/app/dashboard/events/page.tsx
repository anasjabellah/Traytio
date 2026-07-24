import { getEventsPage } from '@/features/events/actions/get-events-page';
import { EVENT_DEFAULT_PAGE_SIZE } from '@/features/events/constants';
import { EventsPageClient } from './events-page-client';

export default async function EventsPage() {
  const result = await getEventsPage({ limit: EVENT_DEFAULT_PAGE_SIZE });

  if (result.success && result.data) {
    return <EventsPageClient initialData={result.data} />;
  }

  return <EventsPageClient />;
}