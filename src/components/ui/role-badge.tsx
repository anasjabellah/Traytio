import type { OrgRole } from '@prisma/client'

const ROLE_STYLES: Record<OrgRole, string> = {
  OWNER: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  ADMIN: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  MEMBER: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200/60',
}

const ROLE_LABELS: Record<OrgRole, string> = {
  OWNER: 'Propriétaire',
  ADMIN: 'Administrateur',
  MEMBER: 'Membre',
}

export function RoleBadge({ role, className = '' }: { role: OrgRole; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-none ${ROLE_STYLES[role]} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${
        role === 'OWNER' ? 'bg-amber-500' : role === 'ADMIN' ? 'bg-blue-500' : 'bg-gray-400'
      }`} />
      {ROLE_LABELS[role]}
    </span>
  )
}
