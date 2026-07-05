'use client';

import { useQuery } from '@tanstack/react-query';
import { getActivity } from '@/features/activity/actions/get-activity';

export function useActivityFeed() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => getActivity(),
  });

  return {
    items: data?.data?.items ?? [],
    stats: data?.data?.stats ?? { totalToday: 0, totalWeek: 0, totalMonth: 0 },
    loading: isLoading,
    error: error instanceof Error ? error.message : (data?.error ?? null),
    refresh: () => refetch(),
  };
}
