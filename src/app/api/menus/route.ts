import { NextResponse } from 'next/server';
import { getMenus } from '@/features/menus/actions/get-menus';
import { createMenu } from '@/features/menus/actions/create-menu';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || undefined;
    const page = Number(url.searchParams.get('page') || '') || 1;
    const limit = Number(url.searchParams.get('limit') || '') || 10;

    const sortByParam = url.searchParams.get('sortBy');
    const sortBy =
      sortByParam === 'name' || sortByParam === 'createdAt' || sortByParam === 'pricePerPerson' || sortByParam === 'minPersons'
        ? sortByParam
        : 'createdAt';

    const sortOrderParam = url.searchParams.get('sortOrder');
    const sortOrder =
      sortOrderParam === 'asc' || sortOrderParam === 'desc' ? sortOrderParam : 'desc';

    const response = await getMenus({ search, page, limit, sortBy, sortOrder });
    if (response.success) {
      return NextResponse.json(response.data);
    }
    return NextResponse.json({ error: response.error ?? 'Failed to fetch menus' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const response = await createMenu(data);
    if (response.success) {
      return NextResponse.json(response.data, { status: 201 });
    }
    return NextResponse.json({ error: response.error ?? 'Failed to create menu' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Invalid request' }, { status: 400 });
  }
}
