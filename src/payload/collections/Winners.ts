import type { CollectionConfig, Field } from 'payload'

import { isStaff, nobody, nobodyField } from '../access'
import { groups, label } from '../fields/label'
import { readOnly } from '../fields/readOnly'

/** Fields recording what the draw selected, or its voiding; only services write them. */
function serviceOnly(fields: Field[]): Field[] {
  return readOnly(fields).map((field) =>
    'name' in field ? ({ ...field, access: { update: nobodyField } } as Field) : field,
  )
}

/**
 * A participation selected by a draw (SPECIFICATION §10–11). The draw result is fixed; staff only
 * edit how the winner is presented publicly. Voiding goes through the re-draw service.
 */
export const Winners: CollectionConfig = {
  slug: 'winners',
  labels: { singular: label('Gagnant', 'Winner'), plural: label('Gagnants', 'Winners') },
  admin: {
    group: groups.contests,
    useAsTitle: 'publicDisplayName',
    defaultColumns: ['publicDisplayName', 'draw', 'published', 'voided'],
  },
  access: {
    read: isStaff,
    create: nobody,
    update: isStaff,
    delete: nobody,
  },
  fields: [
    ...serviceOnly([
      {
        name: 'draw',
        label: label('Tirage', 'Draw'),
        type: 'relationship',
        relationTo: 'draws',
        required: true,
        index: true,
      },
      {
        name: 'participation',
        label: label('Participation', 'Participation'),
        type: 'relationship',
        relationTo: 'participations',
        required: true,
      },
      { name: 'rank', label: label('Rang', 'Rank'), type: 'number', required: true },
      {
        name: 'selectedAt',
        label: label('Tiré le', 'Selected at'),
        type: 'date',
        required: true,
        admin: { date: { pickerAppearance: 'dayAndTime' } },
      },
    ]),
    {
      type: 'collapsible',
      label: label('Publication', 'Publication'),
      fields: [
        {
          name: 'publicDisplayName',
          label: label('Nom affiché', 'Public name'),
          type: 'text',
          required: true,
          admin: { description: label('Par exemple « Amine B. ».', 'For example "Amine B.".') },
        },
        {
          name: 'publicMedia',
          label: label('Photo ou vidéo', 'Photo or video'),
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'published',
          label: label('Publié', 'Published'),
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      type: 'collapsible',
      label: label('Annulation', 'Voiding'),
      fields: serviceOnly([
        { name: 'voided', label: label('Annulé', 'Voided'), type: 'checkbox', defaultValue: false },
        { name: 'voidReason', label: label('Motif', 'Reason'), type: 'textarea' },
        {
          name: 'voidedBy',
          label: label('Annulé par', 'Voided by'),
          type: 'relationship',
          relationTo: 'users',
        },
        {
          name: 'voidedAt',
          label: label('Annulé le', 'Voided at'),
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
      ]),
    },
  ],
}
