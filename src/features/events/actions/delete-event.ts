'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/features/events/types';
import { getOrganizationId } from '@/lib/get-organization-id';

let _deleteEventCalls = 0;

export async function deleteEvent(id: string): Promise<ActionResponse<void>> {
  try {
    _deleteEventCalls++;
    if (_deleteEventCalls % 20 === 0) console.warn(`[CALL_TRACE] deleteEvent called ${_deleteEventCalls} times`);

    console.time('deleteEvent:total');

    const organizationId = await getOrganizationId();

    console.time('deleteEvent:delete');
    await prisma.event.delete({
      where: { id, organizationId }
    });
    console.timeEnd('deleteEvent:delete');

    console.timeEnd('deleteEvent:total');
    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}