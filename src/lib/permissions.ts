import type { OrgRole } from '@prisma/client'

export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage-items'
  | 'send'
  | 'settings'
  | 'invite'
  | 'remove'
  | 'change-role'
  | 'billing'
  | 'delete-org'
  | 'view'
  | 'sentry'
  | 'impersonate'
  | 'audit-logs'
  | 'system-metrics'
  | 'db-access'
  | 'feature-flags'
  | 'organizations'

export type Module =
  | 'dashboard'
  | 'commandes'
  | 'clients'
  | 'events'
  | 'menus'
  | 'menu-items'
  | 'invoices'
  | 'payments'
  | 'team'
  | 'settings'
  | 'superadmin'

export const PERMISSIONS: Record<Module, Partial<Record<Action, OrgRole[]>>> = {
  dashboard: {
    view: ['SUPERADMIN', 'OWNER', 'ADMIN', 'MEMBER'],
  },
  commandes: {
    create: ['SUPERADMIN', 'OWNER', 'ADMIN', 'MEMBER'],
    read: ['SUPERADMIN', 'OWNER', 'ADMIN', 'MEMBER'],
    update: ['SUPERADMIN', 'OWNER', 'ADMIN', 'MEMBER'],
    delete: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    'manage-items': ['SUPERADMIN', 'OWNER', 'ADMIN'],
  },
  clients: {
    create: ['SUPERADMIN', 'OWNER', 'ADMIN', 'MEMBER'],
    read: ['SUPERADMIN', 'OWNER', 'ADMIN', 'MEMBER'],
    update: ['SUPERADMIN', 'OWNER', 'ADMIN', 'MEMBER'],
    delete: ['SUPERADMIN', 'OWNER', 'ADMIN'],
  },
  events: {
    create: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    read: ['SUPERADMIN', 'OWNER', 'ADMIN', 'MEMBER'],
    update: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    delete: ['SUPERADMIN', 'OWNER', 'ADMIN'],
  },
  menus: {
    create: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    read: ['SUPERADMIN', 'OWNER', 'ADMIN', 'MEMBER'],
    update: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    delete: ['SUPERADMIN', 'OWNER', 'ADMIN'],
  },
  'menu-items': {
    create: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    read: ['SUPERADMIN', 'OWNER', 'ADMIN', 'MEMBER'],
    update: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    delete: ['SUPERADMIN', 'OWNER', 'ADMIN'],
  },
  invoices: {
    create: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    read: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    update: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    delete: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    send: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    settings: ['SUPERADMIN', 'OWNER', 'ADMIN'],
  },
  payments: {
    create: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    read: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    delete: ['SUPERADMIN', 'OWNER', 'ADMIN'],
  },
  team: {
    view: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    invite: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    remove: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    'change-role': ['SUPERADMIN', 'OWNER', 'ADMIN'],
  },
  settings: {
    read: ['SUPERADMIN', 'OWNER', 'ADMIN'],
    update: ['SUPERADMIN', 'OWNER'],
    billing: ['SUPERADMIN', 'OWNER'],
    'delete-org': ['SUPERADMIN', 'OWNER'],
  },
  superadmin: {
    organizations: ['SUPERADMIN'],
    'audit-logs': ['SUPERADMIN'],
    'system-metrics': ['SUPERADMIN'],
    'db-access': ['SUPERADMIN'],
    'feature-flags': ['SUPERADMIN'],
    impersonate: ['SUPERADMIN'],
  },
}
