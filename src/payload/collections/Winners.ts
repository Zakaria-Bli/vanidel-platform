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
  labels: {
    singular: label('Gagnant', 'Winner', 'الفائز'),
    plural: label('Gagnants', 'Winners', 'الفائزون'),
  },
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
        label: label('Tirage', 'Draw', 'السحب'),
        type: 'relationship',
        relationTo: 'draws',
        required: true,
        index: true,
      },
      {
        name: 'participation',
        label: label('Participation', 'Participation', 'المشاركة'),
        type: 'relationship',
        relationTo: 'participations',
        required: true,
      },
      { name: 'rank', label: label('Rang', 'Rank', 'الترتيب'), type: 'number', required: true },
      {
        name: 'selectedAt',
        label: label('Tiré le', 'Selected at', 'اختير في'),
        type: 'date',
        required: true,
        admin: { date: { pickerAppearance: 'dayAndTime' } },
      },
    ]),
    {
      type: 'collapsible',
      label: label('Publication', 'Publication', 'النشر'),
      fields: [
        {
          name: 'publicDisplayName',
          label: label('Nom affiché', 'Public name', 'الاسم المعروض'),
          type: 'text',
          required: true,
          admin: {
            description: label(
              'Par exemple « Amine B. ».',
              'For example "Amine B.".',
              'مثال: «أمين ب.».',
            ),
          },
        },
        {
          name: 'publicMedia',
          label: label('Photo ou vidéo', 'Photo or video', 'صورة أو فيديو'),
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'published',
          label: label('Publié', 'Published', 'منشور'),
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      type: 'collapsible',
      label: label('Annulation', 'Voiding', 'الإلغاء'),
      fields: serviceOnly([
        {
          name: 'voided',
          label: label('Annulé', 'Voided', 'ملغى'),
          type: 'checkbox',
          defaultValue: false,
        },
        { name: 'voidReason', label: label('Motif', 'Reason', 'السبب'), type: 'textarea' },
        {
          name: 'voidedBy',
          label: label('Annulé par', 'Voided by', 'أُلغي من طرف'),
          type: 'relationship',
          relationTo: 'users',
        },
        {
          name: 'voidedAt',
          label: label('Annulé le', 'Voided at', 'أُلغي في'),
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
      ]),
    },
  ],
}
