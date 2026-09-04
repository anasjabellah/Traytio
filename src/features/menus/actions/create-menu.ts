'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { ActionResponse, Menu, CreateMenuInput } from '@/features/menus/types';
import { createMenuSchema } from '@/features/menus/validations/create-menu-schema';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { MENU } from '@/lib/notify/messages';
import { withActionGuard } from '@/lib/action-guard';
import { normalizeActionError } from '@/lib/action-error';
import { verifyBatchFkOwnership } from '@/lib/fk-ownership';

async function createMenuHandler(data: CreateMenuInput): Promise<ActionResponse<Menu>> {
  try {
    const parsed = createMenuSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || MENU.INVALID_INPUT };
    }
    const validData = parsed.data;
    const organizationId = await getOrganizationId();
    await assertCan('menus', 'create');

    // ── Verify foreign-key ownership (client-provided menuItemIds must belong to this org) ──
    const menuItemIds = (validData.menuItems ?? [])
      .map((item) => item.menuItemId)
      .filter((id): id is string => Boolean(id));
    const fkError = await verifyBatchFkOwnership(
      prisma.menuItem, menuItemIds, organizationId, 'menu item',
    );
    if (fkError) return fkError;

    const menu = await prisma.menu.create({
      data: {
        organizationId,
        name: validData.name,
        description: validData.description,
        category: validData.category,
        pricePerPerson: validData.pricePerPerson,
        minPersons: validData.minPersons ?? 1,
        maxPersons: validData.maxPersons,
        isActive: validData.isActive ?? true,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        description: true,
        category: true,
        pricePerPerson: true,
        minPersons: true,
        maxPersons: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (validData.menuItems && validData.menuItems.length > 0) {
      await prisma.menuMenuItem.createMany({
        data: validData.menuItems.map(item => ({
          menuId: menu.id,
          menuItemId: item.menuItemId,
          defaultQty: item.defaultQty,
        })),
      });
    }

    revalidatePath("/dashboard/menus")

    return {
      success: true,
      data: { ...menu, pricePerPerson: Number(menu.pricePerPerson) },
    };
  } catch (e: unknown) {
    return { success: false, error: normalizeActionError(e, MENU.CREATE.ERROR) };
  }
}

export const createMenu = withActionGuard(createMenuHandler, { name: 'menus:create' })
