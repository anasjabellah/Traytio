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

export type TeamPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TeamData = {
  members: TeamMember[];
  invitations: TeamInvitation[];
  pagination: TeamPagination;
};

export type TeamStats = {
  totalMembers: number;
  activeMembers: number;
  pendingInvitations: number;
  adminCount: number;
  perfTotal: number[];
  perfActive: number[];
  perfInvites: number[];
  perfAdmins: number[];
};
