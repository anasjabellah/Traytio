import { NextResponse } from 'next/server';
import { getEvents } from '@/features/events/actions/get-events';
import { createEvent } from '@/features/events/actions/create-event';

// GET /api/events - list events with optional query params (search, page, limit, sortBy, sortOrder)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') ?? undefined;
  const page = url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined;
  const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined;
  const sortBy = url.searchParams.get('sortBy') as any ?? undefined;
  const sortOrder = url.searchParams.get('sortOrder') as any ?? undefined;

  const resp = await getEvents({ search, page, limit, sortBy, sortOrder });
  if (resp.success && resp.data) {
    return NextResponse.json(resp.data);
  }
  return NextResponse.json({ error: resp.error ?? 'Failed to fetch events' }, { status: 400 });
}

// POST /api/events - create a new event
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const resp = await createEvent(data);
    if (resp.success && resp.data) {
      return NextResponse.json(resp.data, { status: 201 });
    }
    return NextResponse.json({ error: resp.error ?? 'Failed to create event' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Invalid request' }, { status: 400 });
  }
}
