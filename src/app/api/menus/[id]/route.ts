import { NextResponse } from 'next/server';
import { getMenuById } from '@/features/menus/actions/get-menu-by-id';
import { updateMenu } from '@/features/menus/actions/update-menu';
import { deleteMenu } from '@/features/menus/actions/delete-menu';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await getMenuById(id);
    if (response.success && response.data) {
      return NextResponse.json(response.data);
    }
    return NextResponse.json({ error: response.error ?? 'Menu not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const response = await updateMenu({ ...data, id });
    if (response.success && response.data) {
      return NextResponse.json(response.data);
    }
    return NextResponse.json({ error: response.error ?? 'Failed to update menu' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await deleteMenu(id);
    if (response.success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: response.error ?? 'Failed to delete menu' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}