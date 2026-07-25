'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTeam } from '@/features/team/actions/get-team';
import { computeKpi } from '@/features/dashboard/lib/kpi-engine';
import type { TeamMember, TeamInvitation, TeamStats, TeamPagination } from '@/features/team/types';

type TeamQueryData = {
  members: TeamMember[];
  invitations: TeamInvitation[];
  stats: TeamStats;
  pagination: TeamPagination;
};

export function useTeam(page = 1, limit = 20, initialData?: TeamQueryData | null) {
  const queryKey = ['team', page, limit] as const;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await getTeam({ page, limit });
      if (res.success && res.data) return res.data;
      throw new Error(res.error ?? 'Erreur lors du chargement de l\'équipe');
    },
    initialData: initialData ?? undefined,
    initialDataUpdatedAt: Date.now(),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const teamData = query.data ?? null;
  const members = teamData?.members ?? [];
  const invitations = teamData?.invitations ?? [];
  const stats: TeamStats | null = teamData?.stats ?? null;
  const pagination: TeamPagination = teamData?.pagination ?? { page, limit, total: 0, totalPages: 0 };

  const totalKpi = useMemo(() => computeKpi(stats?.perfTotal ?? []), [stats?.perfTotal]);
  const activeKpi = useMemo(() => computeKpi(stats?.perfActive ?? []), [stats?.perfActive]);
  const inviteKpi = useMemo(() => computeKpi(stats?.perfInvites ?? []), [stats?.perfInvites]);
  const adminKpi = useMemo(() => computeKpi(stats?.perfAdmins ?? []), [stats?.perfAdmins]);

  return {
    members,
    invitations,
    pagination,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    stats,
    totalKpi,
    activeKpi,
    inviteKpi,
    adminKpi,
    refresh: () => query.refetch(),
  };
}
