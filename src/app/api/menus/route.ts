import { NextResponse } from 'next/server';
import { getMenus } from '@/features/menus/actions/get-menus';
import { createMenu } from '@/features/menus/actions/create-menu';

// GET /api/menus - list menus with optional query params (search, page, limit, sortBy, sortOrder)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') ?? undefined;
  const page = url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined;
  const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined;
  const sortBy = (url.searchParams.get('sortBy') as any) ?? undefined;
  const sortOrder = (url.searchParams.get('sortOrder') as any) ?? undefined;

  const resp = await getMenus({ search, page, limit, sortBy, sortOrder });
  if (resp.success && resp.data) {
    return NextResponse.json(resp.data);
  }
  return NextResponse.json({ error: resp.error ?? 'Failed to fetch menus' }, { status: 400 });
}

// POST /api/menus - create a new menu
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const resp = await createMenu(data);
    if (resp.success && resp.data) {
      return NextResponse.json(resp.data, { status: 201 });
    }
    return NextResponse.json({ error: resp.error ?? 'Failed to create menu' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Invalid request' }, { status: 400 });
  }
}
