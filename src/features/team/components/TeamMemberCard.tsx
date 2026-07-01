'use client';

import { motion } from 'framer-motion';
import { Crown, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { RoleBadge } from '@/components/ui/role-badge';
import type { TeamMember } from '@/features/team/types';
import type { OrgRole } from '@prisma/client';
import type { Module, Action } from '@/lib/permissions';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

function Avatar({ name, email }: { name: string | null; email: string }) {
  const initial = (name ?? email).charAt(0).toUpperCase();
  return (
    <div className="size-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-sm font-semibold text-amber-800 shrink-0 ring-2 ring-white shadow-sm">
      {initial}
    </div>
  );
}

interface TeamMemberCardProps {
  member: TeamMember;
  idx: number;
  currentRole: string | null;
  changingRole: string | null;
  canManage: (role: OrgRole) => boolean;
  can: (module: Module, action: Action) => boolean;
  onRoleChange: (id: string, role: OrgRole) => void;
  onRemove: (member: TeamMember) => void;
  onTransfer: (member: TeamMember) => void;
}

export function TeamMemberCard({
  member, idx, currentRole, changingRole, canManage, can, onRoleChange, onRemove, onTransfer,
}: TeamMemberCardProps) {
  const name = `${member.user.firstName ?? ''} ${member.user.lastName ?? ''}`.trim() || 'Utilisateur';
  const isOwner = member.role === 'OWNER';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.025, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
      className="rounded-2xl border border-border/60 bg-card shadow-soft hover:shadow-lift transition-all"
    >
      <div className="p-4">
        <div className="flex items-start gap-3 flex-wrap">
          <Avatar name={name} email={member.user.email} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold line-clamp-1">{name}</span>
              {isOwner && <Crown className="size-3.5 text-amber-500 shrink-0" strokeWidth={2} />}
            </div>
            <div className="text-xs text-muted-foreground/60 truncate">{member.user.email}</div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium ring-1 ring-emerald-200/50 shrink-0 self-start">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Actif
          </span>
        </div>

        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Rôle</span>
            {can('team', 'change-role') && canManage(member.role) && !isOwner ? (
              <div className="relative">
                <select
                  value={member.role}
                  disabled={changingRole === member.id}
                  onChange={(e) => onRoleChange(member.id, e.target.value as OrgRole)}
                  className="appearance-none bg-transparent border border-border rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-medium cursor-pointer hover:border-foreground/20 transition-colors disabled:opacity-50"
                >
                  <option value="ADMIN">Administrateur</option>
                  <option value="MEMBER">Membre</option>
                </select>
                {changingRole === member.id ? (
                  <Loader2 className="size-3 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" strokeWidth={2} />
                )}
              </div>
            ) : (
              <RoleBadge role={member.role} />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Arrivée</span>
            <span className="font-medium text-foreground tabular-nums">{formatDate(member.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 flex items-center justify-end gap-2">
        {!isOwner && currentRole === 'OWNER' && member.role === 'ADMIN' && (
          <button
            onClick={() => onTransfer(member)}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-border bg-white text-xs font-medium text-muted-foreground/60 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all"
          >
            <Crown className="size-3" strokeWidth={1.8} />
            Transférer
          </button>
        )}
        {can('team', 'remove') && canManage(member.role) && !isOwner && (
          <button
            onClick={() => onRemove(member)}
            className="size-9 rounded-lg border border-border bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-muted-foreground/50 transition-all flex items-center justify-center"
            title="Supprimer"
          >
            <Trash2 className="size-3.5" strokeWidth={1.8} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
