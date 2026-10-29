import type { CollectionConfig } from 'payload'

import { isAdmin, isStaff, nobody } from '../access'
import { groups, label } from '../fields/label'
import { readOnly } from '../fields/readOnly'

/**
 * Consent kinds a contest can ask for: accepting the rules, the processing of personal data for
 * the participation, and marketing. Exports to marketing use only `marketing`.
 */
export const consentTypes = ['regulation', 'dataProcessing', 'marketing'] as const

export const consentTypeLabels = {
  regulation: label('Règlement', 'Regulation', 'النظام'),
  dataProcessing: label('Traitement des données', 'Data processing', 'معالجة البيانات'),
  marketing: label('Marketing', 'Marketing', 'التسويق'),
}

/**
 * Historical evidence of a consent decision. Never updated: a Contact's effective consent for a
 * type is its most recent record of that type (SPECIFICATION §7.1).
 */
export const ConsentRecords: CollectionConfig = {
  slug: 'consent-records',
  labels: {
    singular: label('Consentement', 'Consent record', 'سجل الموافقة'),
    plural: label('Consentements', 'Consent records', 'سجلات الموافقة'),
  },
  admin: {
    hideAPIURL: true,
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
      label: label('Contact', 'Contact', 'جهة الاتصال'),
      type: 'relationship',
      relationTo: 'contacts',
      required: true,
    },
    {
      // Set by the participation service on every record. Empty once an admin deletes the
      // participation for good: the consent decision itself stays on record for the contact.
      name: 'participation',
      label: label('Participation', 'Participation', 'المشاركة'),
      type: 'relationship',
      relationTo: 'participations',
    },
    {
      name: 'type',
      label: label('Type', 'Type', 'النوع'),
      type: 'select',
      options: consentTypes.map((value) => ({ value, label: consentTypeLabels[value] })),
      required: true,
    },
    {
      name: 'granted',
      label: label('Accordé', 'Granted', 'مقبول'),
      type: 'checkbox',
      required: true,
    },
    {
      name: 'textVersion',
      label: label('Version du texte', 'Text version', 'إصدار النص'),
      type: 'text',
      required: true,
    },
    {
      name: 'capturedAt',
      label: label('Recueilli le', 'Captured at', 'سُجّلت في'),
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'source', label: label('Origine', 'Source', 'المصدر'), type: 'text', required: true },
  ]),
}
