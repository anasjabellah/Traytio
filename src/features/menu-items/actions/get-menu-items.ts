'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, GetMenuItemsParams, PaginatedMenuItems } from '@/features/menu-items/types';
import { MENU_DEFAULT_PAGE_SIZE } from '@/features/menus/constants';
import { getOrganizationId } from '@/lib/get-organization-id';

export async function getMenuItems(
  params: GetMenuItemsParams,
): Promise<ActionResponse<PaginatedMenuItems>> {
  try {
    const organizationId = await getOrganizationId();
    const {
      search,
      page = 1,
      limit = MENU_DEFAULT_PAGE_SIZE,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
    }
    if (params.category && params.category !== 'ALL') {
      where.category = params.category;
    }

    const total = await prisma.menuItem.count({ where });
    const items = await prisma.menuItem.findMany({
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
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const data = items.map(i => ({ ...i, unitPrice: Number(i.unitPrice) }));
    const totalPages = Math.ceil(total / limit);
    return { success: true, data: { data, total, page, limit, totalPages } };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur lors du chargement des articles' };
  }
}