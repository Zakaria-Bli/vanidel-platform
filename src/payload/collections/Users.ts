import type { CollectionConfig, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

import { isAdmin, isAdminField, isAdminOrSelf, isStaff, roles } from '../access'

/**
 * Default role: the first account becomes an admin, since it is created through Payload's
 * create-first-user screen, where no one is logged in to choose a role. A role given explicitly
 * (by an admin, or through the Local API) always wins.
 */
export const defaultRole = async ({ req }: { req: PayloadRequest }): Promise<User['role']> => {
  const { totalDocs } = await req.payload.count({ collection: 'users', req })
  return totalDocs === 0 ? 'admin' : 'commercial'
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role'],
    // User management is for admins (SPECIFICATION §18). Commercial users keep read access so
    // names on records such as draws still display, and reach their own account from the menu.
    hidden: ({ user }) => user?.role !== 'admin',
  },
  auth: true,
  access: {
    admin: isStaff,
    create: isAdmin,
    read: isStaff,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  fields: [
    // Email added by default
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: defaultRole,
      options: roles.map((value) => ({ label: value === 'admin' ? 'Admin' : 'Commercial', value })),
      saveToJWT: true,
      // Only admins grant roles; a commercial user can still edit their own name and password.
      access: {
        create: isAdminField,
        update: isAdminField,
      },
    },
  ],
}
