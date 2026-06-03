'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse, Menu, PaginatedMenus, GetMenusParams } from '@/features/menus/types';
import { MENU_DEFAULT_PAGE_SIZE } from '@/features/menus/constants';
import { getOrganizationId } from '@/features/menus/actions/_helpers';

export async function getMenus(params: GetMenusParams): Promise<ActionResponse<PaginatedMenus>> {
  try {
    const organizationId = await getOrganizationId();
    const { search, page = 1, limit = MENU_DEFAULT_PAGE_SIZE, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
    }

    const total = await prisma.menu.count({ where });
    const menus = await prisma.menu.findMany({
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
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const data: Menu[] = menus.map((m: any) => ({
      ...m,
      pricePerPerson: Number(m.pricePerPerson),
    }));

    const totalPages = Math.ceil(total / limit);
    return { success: true, data: { data, total, page, limit, totalPages } };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur lors du chargement des menus' };
  }
}
