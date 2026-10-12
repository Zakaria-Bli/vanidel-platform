import type { CollectionConfig } from 'payload'

import { isAdmin, isStaff, nobody } from '../access'
import { groups, label } from '../fields/label'
import { readOnly } from '../fields/readOnly'

export const consentTypes = ['regulation', 'marketing'] as const

/**
 * Historical evidence of a consent decision. Never updated: a Contact's effective consent for a
 * type is its most recent record of that type (SPECIFICATION §7.1).
 */
export const ConsentRecords: CollectionConfig = {
  slug: 'consent-records',
  labels: {
    singular: label('Consentement', 'Consent record'),
    plural: label('Consentements', 'Consent records'),
  },
  admin: {
    group: groups.participations,
    defaultColumns: ['contact', 'type', 'granted', 'capturedAt'],
  },
  access: {
    read: isStaff,
    create: nobody,
    update: nobody,
    delete: isAdmin,
  },
  indexes: [{ fields: ['contact', 'type', 'capturedAt'] }],
  fields: readOnly([
    {
      name: 'contact',
      label: label('Contact', 'Contact'),
      type: 'relationship',
      relationTo: 'contacts',
      required: true,
    },
    {
      name: 'participation',
      label: label('Participation', 'Participation'),
      type: 'relationship',
      relationTo: 'participations',
      required: true,
    },
    {
      name: 'type',
      label: label('Type', 'Type'),
      type: 'select',
      options: [...consentTypes],
      required: true,
    },
    { name: 'granted', label: label('Accordé', 'Granted'), type: 'checkbox', required: true },
    {
      name: 'textVersion',
      label: label('Version du texte', 'Text version'),
      type: 'text',
      required: true,
    },
    {
      name: 'capturedAt',
      label: label('Recueilli le', 'Captured at'),
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'source', label: label('Origine', 'Source'), type: 'text', required: true },
  ]),
}
