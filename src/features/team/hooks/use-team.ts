'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTeam } from '@/features/team/actions/get-team';
import { computeKpi } from '@/features/dashboard/lib/kpi-engine';
import type { TeamStats } from '@/features/team/types';

export const TEAM_QUERY_KEY = ['team'] as const;

export function useTeam() {
  const query = useQuery({
    queryKey: TEAM_QUERY_KEY,
    queryFn: async () => {
      const res = await getTeam();
      if (res.success && res.data) return res.data;
      throw new Error(res.error ?? 'Erreur lors du chargement de l\'équipe');
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const teamData = query.data ?? null;
  const members = teamData?.members ?? [];
  const invitations = teamData?.invitations ?? [];
  const stats: TeamStats | null = teamData?.stats ?? null;

  const totalKpi = useMemo(() => computeKpi(stats?.perfTotal ?? []), [stats?.perfTotal]);
  const activeKpi = useMemo(() => computeKpi(stats?.perfActive ?? []), [stats?.perfActive]);
  const inviteKpi = useMemo(() => computeKpi(stats?.perfInvites ?? []), [stats?.perfInvites]);
  const adminKpi = useMemo(() => computeKpi(stats?.perfAdmins ?? []), [stats?.perfAdmins]);

  return {
    members,
    invitations,
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
