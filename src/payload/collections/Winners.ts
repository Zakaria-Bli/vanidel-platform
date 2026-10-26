import {
  ValidationError,
  type CollectionBeforeChangeHook,
  type CollectionConfig,
  type Field,
} from 'payload'

import { isStaff, nobody, nobodyField } from '../access'
import { groups, label } from '../fields/label'
import { readOnly } from '../fields/readOnly'
import { revalidateWinnersAfterChange } from '../hooks/revalidate'
import { redrawWinner } from '../endpoints/draws'

/** Fields recording what the draw selected, or its voiding; only services write them. */
function serviceOnly(fields: Field[]): Field[] {
  return readOnly(fields).map((field) =>
    'name' in field ? ({ ...field, access: { update: nobodyField } } as Field) : field,
  )
}

/**
 * A voided winner is never published again, whoever saves it: staff, or a form opened before the
 * re-draw voided it. Checked against the stored record, since staff cannot change `voided`.
 */
const neverPublishVoided: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (originalDoc?.voided && data.published === true) {
    throw new ValidationError({
      collection: 'winners',
      errors: [
        {
          path: 'published',
          message:
            'Un gagnant annulé ne peut pas être publié. / A voided winner cannot be published.',
        },
      ],
      req,
    })
  }
  return data
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
    hideAPIURL: true,
    components: { edit: { SaveButton: '/payload/components/SaveButton#SaveButton' } },
    group: groups.contests,
    useAsTitle: 'publicDisplayName',
    defaultColumns: ['publicDisplayName', 'draw', 'published', 'voided'],
  },
  endpoints: [redrawWinner],
  hooks: { beforeChange: [neverPublishVoided], afterChange: [revalidateWinnersAfterChange] },
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
      name: 'verification',
      label: label('Vérification', 'Verification', 'التحقق'),
      type: 'ui',
      admin: { components: { Field: '/payload/components/WinnerReceiptField#WinnerReceiptField' } },
    },
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
          filterOptions: {
            or: [{ mimeType: { like: 'image/' } }, { mimeType: { like: 'video/' } }],
          },
          admin: {
            description: label(
              'Seulement avec l’accord du gagnant. Vidéo : MP4 ou WebM, 10 Mo au plus.',
              'Only with the winner’s consent. Video: MP4 or WebM, 10 MB at most.',
              'فقط بموافقة الفائز. الفيديو: MP4 أو WebM، بحد أقصى 10 ميغابايت.',
            ),
          },
        },
        {
          name: 'published',
          label: label('Publié', 'Published', 'منشور'),
          type: 'checkbox',
          // Winners go public as soon as they are drawn; uncheck to hold one back while checking.
          defaultValue: true,
        },
      ],
    },
    {
      type: 'collapsible',
      label: label('Annulation', 'Voiding', 'الإلغاء'),
      fields: [
        {
          name: 'redraw',
          label: label('Annuler et retirer au sort', 'Void and re-draw', 'إلغاء وإعادة السحب'),
          type: 'ui',
          admin: { components: { Field: '/payload/components/RedrawField#RedrawField' } },
        },
        ...serviceOnly([
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
      ],
    },
  ],
}
