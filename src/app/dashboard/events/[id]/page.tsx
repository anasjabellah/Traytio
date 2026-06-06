import { notFound } from 'next/navigation';
import { getEventById } from '@/features/events/actions/get-event-by-id';
import type { EventDetail } from '@/features/events/types';
import EventDetailView from './event-detail-view';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getEventById(id);
  if (!response.success || !response.data) {
    notFound();
  }
  return <EventDetailView event={response.data as EventDetail} />;
}
