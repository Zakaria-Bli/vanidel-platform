import type { CollectionConfig } from 'payload'

import { locales } from '@/i18n/config'

import { isAdmin, isStaff, nobody } from '../access'
import { groups, label } from '../fields/label'
import { readOnly } from '../fields/readOnly'

/**
 * One accepted submission to one contest. There is no moderation (SPECIFICATION §9): a
 * participation is valid on creation, enters its period's draw pool, and is never modified. The
 * submitted name, phone, email and wilaya are kept exactly as entered.
 */
export const Participations: CollectionConfig = {
  slug: 'participations',
  labels: {
    singular: label('Participation', 'Participation'),
    plural: label('Participations', 'Participations'),
  },
  admin: {
    group: groups.participations,
    useAsTitle: 'name',
    defaultColumns: ['submittedAt', 'name', 'phone', 'wilaya', 'source', 'contest'],
    listSearchableFields: ['name', 'phone', 'phoneNormalized', 'email'],
  },
  access: {
    read: isStaff,
    create: nobody,
    update: nobody,
    delete: isAdmin,
  },
  indexes: [
    // Draw pools and per-contest lists.
    { fields: ['contest', 'submittedAt'] },
    // Entry limit per phone per draw period.
    { fields: ['contest', 'phoneNormalized', 'submittedAt'] },
  ],
  fields: readOnly([
    {
      name: 'contest',
      label: label('Concours', 'Contest'),
      type: 'relationship',
      relationTo: 'contests',
      required: true,
    },
    {
      name: 'contact',
      label: label('Contact', 'Contact'),
      type: 'relationship',
      relationTo: 'contacts',
      required: true,
    },
    {
      name: 'submittedAt',
      label: label('Envoyée le', 'Submitted at'),
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'name', label: label('Nom', 'Name'), type: 'text', required: true },
    {
      name: 'phone',
      label: label('Téléphone saisi', 'Phone as entered'),
      type: 'text',
      required: true,
    },
    {
      name: 'phoneNormalized',
      label: label('Téléphone', 'Phone'),
      type: 'text',
      required: true,
    },
    { name: 'email', label: label('E-mail', 'Email'), type: 'text' },
    { name: 'wilaya', label: label('Wilaya', 'Wilaya'), type: 'text' },
    {
      name: 'ticket',
      label: label('Ticket', 'Ticket'),
      type: 'upload',
      relationTo: 'tickets',
      required: true,
    },
    {
      name: 'locale',
      label: label('Langue', 'Language'),
      type: 'select',
      options: [...locales],
      required: true,
    },
    {
      type: 'collapsible',
      label: label('Provenance', 'Source'),
      fields: readOnly([
        { name: 'source', label: label('Canal', 'Channel'), type: 'text' },
        { name: 'utmSource', type: 'text' },
        { name: 'utmMedium', type: 'text' },
        { name: 'utmCampaign', type: 'text' },
        { name: 'utmContent', type: 'text' },
      ]),
    },
  ]),
}
