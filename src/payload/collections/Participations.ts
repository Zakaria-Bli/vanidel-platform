import type { CollectionConfig } from 'payload'

import { localeMetadata, locales } from '@/i18n/config'

import { isAdmin, isStaff, nobody } from '../access'
import { groups, label } from '../fields/label'
import { readOnly } from '../fields/readOnly'
import { exportParticipations } from '../endpoints/exports'

/**
 * One accepted submission to one contest. There is no moderation (SPECIFICATION §9): a
 * participation is valid on creation, enters its period's draw pool, and is never modified. The
 * submitted name, phone, email and wilaya are kept exactly as entered.
 */
export const Participations: CollectionConfig = {
  slug: 'participations',
  labels: {
    singular: label('Participation', 'Participation', 'المشاركة'),
    plural: label('Participations', 'Participations', 'المشاركات'),
  },
  admin: {
    hideAPIURL: true,
    group: groups.participations,
    useAsTitle: 'name',
    defaultColumns: ['submittedAt', 'ticket', 'name', 'phone', 'wilaya', 'source', 'contest'],
    listSearchableFields: ['name', 'phone', 'phoneNormalized', 'email'],
    components: {
      beforeListTable: ['/payload/components/ExportPanel#ParticipationExport'],
    },
  },
  endpoints: [exportParticipations],
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
      label: label('Concours', 'Contest', 'المسابقة'),
      type: 'relationship',
      relationTo: 'contests',
      required: true,
    },
    {
      name: 'periodStart',
      label: label('Période de tirage (début)', 'Draw period (start)', 'فترة السحب (البداية)'),
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: label(
          'Calculée à l’envoi, pour filtrer la liste. Les tirages utilisent la date d’envoi.',
          'Computed on submission, for filtering. Draws use the submission time.',
          'تُحسب عند الإرسال لتصفية القائمة. تعتمد السحوبات على وقت الإرسال.',
        ),
      },
    },
    {
      name: 'contact',
      label: label('Contact', 'Contact', 'جهة الاتصال'),
      type: 'relationship',
      relationTo: 'contacts',
      required: true,
    },
    {
      name: 'submittedAt',
      label: label('Envoyée le', 'Submitted at', 'أُرسلت في'),
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'name', label: label('Nom', 'Name', 'الاسم'), type: 'text', required: true },
    {
      name: 'phone',
      label: label('Téléphone saisi', 'Phone as entered', 'الهاتف كما أُدخل'),
      type: 'text',
      required: true,
    },
    {
      name: 'phoneNormalized',
      label: label('Téléphone', 'Phone', 'الهاتف'),
      type: 'text',
      required: true,
    },
    { name: 'email', label: label('E-mail', 'Email', 'البريد الإلكتروني'), type: 'text' },
    {
      name: 'wilaya',
      label: label('Wilaya', 'Wilaya', 'الولاية'),
      type: 'text',
      admin: { components: { Cell: '/payload/components/WilayaCell#WilayaCell' } },
    },
    {
      name: 'ticket',
      label: label('Ticket', 'Ticket', 'التذكرة'),
      type: 'upload',
      relationTo: 'tickets',
      required: true,
      admin: { components: { Cell: '/payload/components/TicketCell#TicketCell' } },
    },
    {
      name: 'locale',
      label: label('Langue', 'Language', 'اللغة'),
      type: 'select',
      options: locales.map((value) => ({ value, label: localeMetadata[value].nativeName })),
      required: true,
    },
    {
      type: 'collapsible',
      label: label('Provenance', 'Source', 'المصدر'),
      fields: readOnly([
        { name: 'source', label: label('Canal', 'Channel', 'القناة'), type: 'text' },
        { name: 'utmSource', label: label('Source UTM', 'UTM source', 'مصدر UTM'), type: 'text' },
        { name: 'utmMedium', label: label('Support UTM', 'UTM medium', 'وسيط UTM'), type: 'text' },
        {
          name: 'utmCampaign',
          label: label('Campagne UTM', 'UTM campaign', 'حملة UTM'),
          type: 'text',
        },
        {
          name: 'utmContent',
          label: label('Contenu UTM', 'UTM content', 'محتوى UTM'),
          type: 'text',
        },
      ]),
    },
  ]),
}
