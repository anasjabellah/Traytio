'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { ActionResponse, Menu, PaginatedMenus, GetMenusParams } from '@/features/menus/types';
import { MENU_DEFAULT_PAGE_SIZE } from '@/features/menus/constants';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import { MENU } from '@/lib/notify/messages';
import { withActionGuard } from '@/lib/action-guard';
import { normalizeActionError } from '@/lib/action-error';

const getMenusSchema = z.object({
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['name', 'createdAt', 'pricePerPerson', 'minPersons']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

async function getMenusHandler(params: GetMenusParams): Promise<ActionResponse<PaginatedMenus>> {
  try {
    getMenusSchema.parse(params);
    const organizationId = await getOrganizationId();
    await assertCan('menus', 'read');
    const { search, page = 1, limit = MENU_DEFAULT_PAGE_SIZE, sortBy = 'createdAt', sortOrder = 'desc', category, isActive } = params;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
    }
    if (category) {
      where.category = category;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [total, menus] = await Promise.all([
      prisma.menu.count({ where }),
      prisma.menu.findMany({
      where,
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
        menuItems: {
          select: {
            id: true,
            menuItemId: true,
            defaultQty: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                category: true,
                unitPrice: true,
                unit: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    ]);

    const data: Menu[] = menus.map((m: any) => ({
      ...m,
      pricePerPerson: Number(m.pricePerPerson),
      menuItems: m.menuItems?.map((mi: any) => ({
        ...mi,
        menuItem: {
          ...mi.menuItem,
          unitPrice: Number(mi.menuItem.unitPrice),
        },
      })),
    }));

    const totalPages = Math.ceil(total / limit);
    return { success: true, data: { data, total, page, limit, totalPages } };
  } catch (e: unknown) {
    return { success: false, error: normalizeActionError(e, MENU.FETCH_ERROR) };
  }
}

export const getMenus = withActionGuard(getMenusHandler, { name: 'menus:read' })
