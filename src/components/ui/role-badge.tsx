import type { OrgRole } from '@prisma/client'

const ROLE_STYLES: Record<OrgRole, string> = {
  OWNER: 'bg-amber-50/80 text-amber-700 border-amber-200/60',
  ADMIN: 'bg-blue-50/80 text-blue-700 border-blue-200/60',
  MEMBER: 'bg-gray-50/80 text-gray-600 border-gray-200/60',
  SUPERADMIN: 'bg-purple-50/80 text-purple-700 border-purple-200/60',
}

const ROLE_DOT: Record<OrgRole, string> = {
  OWNER: 'bg-amber-500 shadow-[0_0_4px_rgba(217,119,6,0.25)]',
  ADMIN: 'bg-blue-500 shadow-[0_0_4px_rgba(37,99,235,0.25)]',
  MEMBER: 'bg-gray-400',
  SUPERADMIN: 'bg-purple-500 shadow-[0_0_4px_rgba(147,51,234,0.25)]',
}

const ROLE_LABELS: Record<OrgRole, string> = {
  OWNER: 'Propriétaire',
  ADMIN: 'Administrateur',
  MEMBER: 'Membre',
  SUPERADMIN: 'Superadmin',
}

export function RoleBadge({ role, className = '' }: { role: OrgRole; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3.5 h-9 rounded-full border text-xs font-medium tracking-wide leading-none ${ROLE_STYLES[role]} ${className}`}
    >
      <span className={`size-2 rounded-full shrink-0 ${ROLE_DOT[role]}`} />
      {ROLE_LABELS[role]}
    </span>
  )
}
