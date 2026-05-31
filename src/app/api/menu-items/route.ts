// src/app/api/menu-items/route.ts

import { NextResponse } from 'next/server';
import { getMenuItems } from '@/features/menu-items/actions/get-menu-items';
import { createMenuItem } from '@/features/menu-items/actions/create-menu-item';

// GET /api/menu-items - list menu items with optional query params
// Params: search, page, limit, sortBy, sortOrder
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || undefined;
    const page = Number(url.searchParams.get('page') || '') || 1;
    const limit = Number(url.searchParams.get('limit') || '') || 10;

    const sortByParam = url.searchParams.get('sortBy');
    const sortBy =
      sortByParam === 'name' || sortByParam === 'createdAt' || sortByParam === 'unitPrice'
        ? sortByParam
        : 'createdAt';

    const sortOrderParam = url.searchParams.get('sortOrder');
    const sortOrder =
      sortOrderParam === 'asc' || sortOrderParam === 'desc' ? sortOrderParam : 'desc';

    const response = await getMenuItems({ search, page, limit, sortBy, sortOrder });
    if (response.success) {
      return NextResponse.json(response.data);
    }
    return NextResponse.json(
      { error: response.error ?? 'Failed to fetch menu items' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/menu-items - create new menu item
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const response = await createMenuItem(data);
    if (response.success) {
      return NextResponse.json(response.data, { status: 201 });
    }
    return NextResponse.json(
      { error: response.error ?? 'Failed to create menu item' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Invalid request' },
      { status: 400 }
    );
  }
}