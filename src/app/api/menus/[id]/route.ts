import { NextResponse } from 'next/server';
import { getMenuById } from '@/features/menus/actions/get-menu-by-id';
import { updateMenu } from '@/features/menus/actions/update-menu';
import { deleteMenu } from '@/features/menus/actions/delete-menu';
import { withApiGuard } from '@/lib/api-guard';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await getMenuById(id);
    if (response.success && response.data) {
      return NextResponse.json(response.data);
    }
    return NextResponse.json({ error: response.error ?? 'Menu not found' }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function updateMenuApi(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const response = await updateMenu({ ...data, id });
    if (response.success && response.data) {
      return NextResponse.json(response.data);
    }
    return NextResponse.json({ error: response.error ?? 'Failed to update menu' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function deleteMenuApi(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await deleteMenu(id);
    if (response.success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: response.error ?? 'Failed to delete menu' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const PUT = withApiGuard(updateMenuApi);
export const DELETE = withApiGuard(deleteMenuApi);