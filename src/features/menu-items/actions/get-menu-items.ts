'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Prisma, MenuItemCategory } from '@prisma/client';
import type { ActionResponse, GetMenuItemsParams, PaginatedMenuItems } from '@/features/menu-items/types';
import { MENU_ITEM_DEFAULT_PAGE_SIZE } from '@/features/menu-items/constants';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { MENU_ITEM } from '@/lib/notify/messages';
import { withActionGuard } from '@/lib/action-guard';
import { normalizeActionError } from '@/lib/action-error';

const getMenuItemsSchema = z.object({
  search: z.string().max(100).optional(),
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['name', 'createdAt', 'unitPrice']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

async function getMenuItemsHandler(
  params: GetMenuItemsParams,
): Promise<ActionResponse<PaginatedMenuItems>> {
  try {
    getMenuItemsSchema.parse(params);
    const organizationId = await getOrganizationId();
    await assertCan('menu-items', 'read');
    const {
      search,
      page = 1,
      limit = MENU_ITEM_DEFAULT_PAGE_SIZE,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.MenuItemWhereInput = { organizationId };
    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
    }
    if (params.category && params.category !== 'ALL') {
      where.category = params.category as MenuItemCategory;
    }
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [total, items] = await Promise.all([
      prisma.menuItem.count({ where }),
      prisma.menuItem.findMany({
        where,
        select: {
          id: true,
          organizationId: true,
          name: true,
          category: true,
          unitPrice: true,
          unit: true,
          isActive: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          imageUrl: true,
          _count: { select: { menus: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    const data = items.map(i => ({ ...i, unitPrice: Number(i.unitPrice), usageCount: i._count.menus }));
    const totalPages = Math.ceil(total / limit);
    return { success: true, data: { data, total, page, limit, totalPages } };
  } catch (e: unknown) {
    return { success: false, error: normalizeActionError(e, MENU_ITEM.FETCH_ERROR) };
  }
}

export const getMenuItems = withActionGuard(getMenuItemsHandler, { name: 'menu-items:read' })