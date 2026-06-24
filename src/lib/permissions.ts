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

export const PERMISSIONS: Record<Module, Partial<Record<Action, OrgRole[]>>> = {
  dashboard: {
    view: ['OWNER', 'ADMIN', 'MEMBER'],
  },
  commandes: {
    create: ['OWNER', 'ADMIN', 'MEMBER'],
    read: ['OWNER', 'ADMIN', 'MEMBER'],
    update: ['OWNER', 'ADMIN', 'MEMBER'],
    delete: ['OWNER', 'ADMIN'],
    'manage-items': ['OWNER', 'ADMIN'],
  },
  clients: {
    create: ['OWNER', 'ADMIN', 'MEMBER'],
    read: ['OWNER', 'ADMIN', 'MEMBER'],
    update: ['OWNER', 'ADMIN', 'MEMBER'],
    delete: ['OWNER', 'ADMIN'],
  },
  events: {
    create: ['OWNER', 'ADMIN'],
    read: ['OWNER', 'ADMIN', 'MEMBER'],
    update: ['OWNER', 'ADMIN'],
    delete: ['OWNER', 'ADMIN'],
  },
  menus: {
    create: ['OWNER', 'ADMIN'],
    read: ['OWNER', 'ADMIN', 'MEMBER'],
    update: ['OWNER', 'ADMIN'],
    delete: ['OWNER', 'ADMIN'],
  },
  'menu-items': {
    create: ['OWNER', 'ADMIN'],
    read: ['OWNER', 'ADMIN', 'MEMBER'],
    update: ['OWNER', 'ADMIN'],
    delete: ['OWNER', 'ADMIN'],
  },
  invoices: {
    create: ['OWNER', 'ADMIN'],
    read: ['OWNER', 'ADMIN'],
    update: ['OWNER', 'ADMIN'],
    delete: ['OWNER', 'ADMIN'],
    send: ['OWNER', 'ADMIN'],
    settings: ['OWNER', 'ADMIN'],
  },
  payments: {
    create: ['OWNER', 'ADMIN'],
    read: ['OWNER', 'ADMIN'],
    delete: ['OWNER', 'ADMIN'],
  },
  team: {
    view: ['OWNER', 'ADMIN'],
    invite: ['OWNER', 'ADMIN'],
    remove: ['OWNER', 'ADMIN'],
    'change-role': ['OWNER', 'ADMIN'],
  },
  settings: {
    read: ['OWNER', 'ADMIN'],
    update: ['OWNER'],
    billing: ['OWNER'],
    'delete-org': ['OWNER'],
  },
}
