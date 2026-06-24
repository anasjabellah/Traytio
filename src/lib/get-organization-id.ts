import { cache } from 'react';
import { getCurrentMembership } from '@/lib/assert-role';

export const getOrganizationId = cache(async (): Promise<string> => {
  const { organizationId } = await getCurrentMembership();
  return organizationId;
});
