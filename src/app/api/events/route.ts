import { NextResponse } from 'next/server';
import { getEvents } from '@/features/events/actions/get-events';
import { createEvent } from '@/features/events/actions/create-event';
import { withApiGuard } from '@/lib/api-guard';

// GET /api/events - list events with optional query params (search, page, limit, sortBy, sortOrder)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') ?? undefined;
  const page = url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined;
  const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined;
  const sortBy = (url.searchParams.get('sortBy') ?? undefined) as "name" | "createdAt" | "budget" | "startDate" | undefined;
  const sortOrder = (url.searchParams.get('sortOrder') ?? undefined) as "asc" | "desc" | undefined;

  const resp = await getEvents({ search, page, limit, sortBy, sortOrder });
  if (resp.success && resp.data) {
    return NextResponse.json(resp.data);
  }
  return NextResponse.json({ error: resp.error ?? 'Failed to fetch events' }, { status: 400 });
}

// POST /api/events - create a new event
async function createEventApi(request: Request) {
  try {
    const data = await request.json();
    const resp = await createEvent(data);
    if (resp.success && resp.data) {
      return NextResponse.json(resp.data, { status: 201 });
    }
    return NextResponse.json({ error: resp.error ?? 'Failed to create event' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const POST = withApiGuard(createEventApi);
