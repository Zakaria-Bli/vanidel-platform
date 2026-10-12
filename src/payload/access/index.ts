import type { Access, FieldAccess, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

// Collection and field access rules shared by every collection. Public (anonymous) writes never go
// through collection access: they use the services in src/modules with `overrideAccess: true`.

export const roles = ['admin', 'commercial'] as const

export type Role = (typeof roles)[number]

function userOf(req: PayloadRequest): User | null {
  return req.user?.collection === 'users' ? (req.user as User) : null
}

export function hasRole(req: PayloadRequest, ...allowed: Role[]): boolean {
  const role = userOf(req)?.role
  return role !== undefined && allowed.includes(role)
}

export const anyone: Access = () => true

export const nobody: Access = () => false

// Boolean-only rules are typed by their arguments so they also fit `access.admin`, which takes no
// query constraints.
export const isAdmin = ({ req }: { req: PayloadRequest }): boolean => hasRole(req, 'admin')

/** Any back-office user: admin or commercial. */
export const isStaff = ({ req }: { req: PayloadRequest }): boolean =>
  hasRole(req, 'admin', 'commercial')

export const isAdminOrSelf: Access = ({ req }) => {
  if (hasRole(req, 'admin')) return true
  const user = userOf(req)
  return user ? { id: { equals: user.id } } : false
}

export const isAdminField: FieldAccess = ({ req }) => hasRole(req, 'admin')

export const isStaffField: FieldAccess = ({ req }) => hasRole(req, 'admin', 'commercial')

export const nobodyField: FieldAccess = () => false
