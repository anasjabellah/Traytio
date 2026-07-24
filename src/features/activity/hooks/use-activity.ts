'use client';

import { useQuery } from '@tanstack/react-query';
import { getActivity } from '@/features/activity/actions/get-activity';
import type { ActivityFeedResponse, ActivityPagination } from '@/features/activity/types';

export function useActivityFeed(
  initialData?: ActivityFeedResponse | null,
  page = 1,
  limit = 20,
) {
  const query = useQuery({
    queryKey: ['activity-feed', page, limit] as const,
    queryFn: async () => {
      const res = await getActivity({ page, limit });
      if (res.success && res.data) return res.data;
      throw new Error(res.error ?? 'Erreur lors du chargement de l\'activité');
    },
    initialData: initialData ?? undefined,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const activityData = query.data ?? null;

  return {
    items: activityData?.items ?? [],
    stats: activityData?.stats ?? { totalToday: 0, totalWeek: 0, totalMonth: 0 },
    pagination: activityData?.pagination ?? ({ page, limit, total: 0, totalPages: 0 } as ActivityPagination),
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refresh: () => query.refetch(),
  };
}
