'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import type { ActionResponse, Event, PaginatedEvents, GetEventsParams } from '@/features/events/types';
import { EVENT_DEFAULT_PAGE_SIZE } from '@/features/events/constants';

async function getOrganizationId(): Promise<string> {
  console.time('getOrganizationId:auth');
  const { userId } = await auth();
  console.timeEnd('getOrganizationId:auth');
  if (!userId) throw new Error('Unauthorized');

    console.time('getOrganizationId:orgLookup');
    const userOrg = await prisma.userOrganization.findFirst({
      where: { user: { clerkId: userId } },
      select: { organizationId: true }
    });
    console.timeEnd('getOrganizationId:orgLookup');

    if (!userOrg) throw new Error('Organization not found');
  return userOrg.organizationId;
}

export async function getEvents(params: GetEventsParams): Promise<ActionResponse<PaginatedEvents>> {
  try {
    console.time('getEvents:total');
    console.time('getEvents:getOrganizationId');
    const organizationId = await getOrganizationId();
    console.timeEnd('getEvents:getOrganizationId');

    const { search, page = 1, limit = EVENT_DEFAULT_PAGE_SIZE, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    console.time('getEvents:count');
    const total = await prisma.event.count({ where });
    console.timeEnd('getEvents:count');

    console.time('getEvents:findMany');
    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        clientId: true,
        name: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        location: true,
        guestCount: true,
        budget: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit
    });
    console.timeEnd('getEvents:findMany');

    const result: Event[] = events.map((event: any) => ({
      ...event,
      budget: Number(event.budget) || null
    }));

    const totalPages = Math.ceil(total / limit);

    console.timeEnd('getEvents:total');
    return { success: true, data: { data: result, total, page, limit, totalPages } };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}