import type { GlobalConfig } from 'payload'

import { anyone, isAdmin, isStaffField } from '../access'
import { integer } from '../fields/integer'
import { groups, label } from '../fields/label'
import { revalidateSettingsAfterChange } from '../hooks/revalidate'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: label('Paramètres', 'Settings'),
  admin: {
    group: groups.administration,
  },
  access: {
    read: anyone,
    update: isAdmin,
  },
  hooks: {
    afterChange: [revalidateSettingsAfterChange],
  },
  fields: [
    {
      type: 'collapsible',
      label: label('Suivi', 'Tracking'),
      fields: [
        {
          name: 'metaPixelId',
          label: label('ID Meta Pixel', 'Meta Pixel ID'),
          type: 'text',
          validate: (value: unknown) =>
            !value || /^\d{10,20}$/.test(String(value)) ? true : 'Digits only.',
        },
        {
          name: 'ga4Id',
          label: label('ID de mesure Google Analytics', 'Google Analytics measurement ID'),
          type: 'text',
          validate: (value: unknown) =>
            !value || /^G-[A-Z0-9]+$/.test(String(value)) ? true : 'Expected G-XXXXXXX.',
        },
      ],
    },
    {
      name: 'socialLinks',
      label: label('Réseaux sociaux', 'Social links'),
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: ['facebook', 'instagram', 'tiktok', 'youtube'],
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'privacyText',
      label: label('Politique de confidentialité', 'Privacy policy'),
      type: 'richText',
      localized: true,
    },
    {
      name: 'legalText',
      label: label('Mentions légales', 'Legal notice'),
      type: 'richText',
      localized: true,
    },
    {
      name: 'retentionDays',
      label: label('Durée de conservation (jours)', 'Retention period (days)'),
      type: 'number',
      min: 1,
      validate: integer,
      admin: {
        step: 1,
        description: label(
          'Durée de conservation des données des participants, à valider juridiquement (loi 18-07).',
          'How long participant data is kept, to be validated legally (Law 18-07).',
        ),
      },
      access: { read: isStaffField },
    },
  ],
}
