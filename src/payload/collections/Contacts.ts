import type { CollectionConfig } from 'payload'

import { isAdmin, isStaff, nobody } from '../access'
import { groups, label } from '../fields/label'
import { readOnly } from '../fields/readOnly'
import { exportMarketingContacts } from '../endpoints/exports'

/**
 * One person in the cross-contest audience, identified only by normalized phone. Created on the
 * first participation from that phone and never updated afterwards (SPECIFICATION §7.1): name,
 * email and wilaya are as first submitted, and exports read the latest participation instead.
 */
export const Contacts: CollectionConfig = {
  slug: 'contacts',
  labels: { singular: label('Contact', 'Contact'), plural: label('Contacts', 'Contacts') },
  admin: {
    group: groups.participations,
    useAsTitle: 'phoneNormalized',
    defaultColumns: ['phoneNormalized', 'name', 'wilaya', 'createdAt'],
    components: {
      beforeListTable: ['/payload/components/ExportPanel#MarketingContactsExport'],
    },
  },
  endpoints: [exportMarketingContacts],
  access: {
    read: isStaff,
    create: nobody,
    update: nobody,
    delete: isAdmin,
  },
  fields: readOnly([
    {
      name: 'phoneNormalized',
      label: label('Téléphone', 'Phone'),
      type: 'text',
      required: true,
      unique: true,
    },
    { name: 'name', label: label('Nom', 'Name'), type: 'text', required: true },
    { name: 'emailNormalized', label: label('E-mail', 'Email'), type: 'text' },
    {
      name: 'wilaya',
      label: label('Wilaya', 'Wilaya'),
      type: 'text',
      admin: { components: { Cell: '/payload/components/WilayaCell#WilayaCell' } },
    },
    {
      name: 'firstContest',
      label: label('Premier concours', 'First contest'),
      type: 'relationship',
      relationTo: 'contests',
      required: true,
    },
  ]),
}
