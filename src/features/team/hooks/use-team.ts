'use client';

import { useState, useEffect, useCallback, useRef, startTransition, useMemo } from 'react';
import { getTeam } from '@/features/team/actions/get-team';
import type { TeamMember, TeamInvitation, TeamKPIs } from '@/features/team/types';

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchingRef = useRef(false);

  const fetch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getTeam();
      if (res.success && res.data) {
        setMembers(res.data.members);
        setInvitations(res.data.invitations);
      } else {
        setError(res.error ?? 'Erreur lors du chargement de l\'équipe');
      }
    } catch (e: any) {
      setError(e.message ?? 'Erreur inattendue');
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    startTransition(() => { fetch(); });
  }, [fetch]);

  const refresh = useCallback(() => {
    fetchingRef.current = false;
    fetch();
  }, [fetch]);

  const kpis: TeamKPIs = useMemo(() => ({
    totalMembers: members.length,
    activeMembers: members.length,
    pendingInvitations: invitations.length,
    adminCount: members.filter((m) => m.role === 'ADMIN').length,
  }), [members, invitations]);

  return { members, invitations, isLoading, error, kpis, refresh };
}
