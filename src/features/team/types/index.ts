import type { OrgRole } from '@prisma/client';

export type TeamMember = {
  id: string;
  userId: string;
  role: OrgRole;
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string | null;
    createdAt: string;
  };
};

export type TeamInvitation = {
  id: string;
  email: string;
  role: OrgRole;
  token: string;
  createdAt: string;
  expiresAt: string;
};

export type TeamData = {
  members: TeamMember[];
  invitations: TeamInvitation[];
};

export type TeamKPIs = {
  totalMembers: number;
  activeMembers: number;
  pendingInvitations: number;
  adminCount: number;
};
