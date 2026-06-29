import { Shield, Crown, UserCheck, Clock } from 'lucide-react';

export const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrateur' },
  { value: 'MEMBER', label: 'Membre' },
] as const;

export const TEAM_KPI_DEFS = [
  { key: 'totalMembers', label: 'Membres', icon: Shield },
  { key: 'activeMembers', label: 'Membres Actifs', icon: UserCheck },
  { key: 'pendingInvitations', label: 'Invitations', icon: Clock },
  { key: 'adminCount', label: 'Administrateurs', icon: Crown },
] as const;
