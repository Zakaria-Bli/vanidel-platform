import type {
  Access,
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionConfig,
  Field,
} from 'payload'

import { localeMetadata, locales } from '@/i18n/config'
import { assertParticipationRemovable } from '@/modules/contests/services/removeParticipation'

import { hasRole, isStaff, nobody, nobodyField } from '../access'
import { groups, label } from '../fields/label'
import { readOnly } from '../fields/readOnly'
import { exportParticipations } from '../endpoints/exports'

/** Read-only in the admin, and never written through the API: only services set these fields. */
function serviceOnly(fields: Field[]): Field[] {
  return readOnly(fields).map((field) =>
    'name' in field ? ({ ...field, access: { update: nobodyField } } as Field) : field,
  )
}

type Data = Record<string, unknown> | undefined

const onlyDeletedAt = (data: Data) =>
  data !== undefined && Object.keys(data).every((key) => key === 'deletedAt')

/** A request that only moves the participation to the trash: `{ deletedAt: <date> }`. */
const isTrashing = (data: Data) => onlyDeletedAt(data) && data?.deletedAt != null

/** A request that only takes the participation out of the trash: `{ deletedAt: null }`. */
const isRestoring = (data: Data) => onlyDeletedAt(data) && data?.deletedAt === null

/**
 * Commercial users review entries daily and move the ineligible ones to the trash; only admins
 * restore them or delete them for good. Payload checks `delete` with `data.deletedAt` set for a
 * move to the trash (the admin pages pass the whole document), and without it for a permanent
 * delete.
 */
const canDelete: Access = ({ req, data }) =>
  hasRole(req, 'admin') || (hasRole(req, 'commercial') && data?.deletedAt != null)

/**
 * Nothing in a participation is editable (every field is service-only): `update` is only the way
 * Payload moves it to the trash and back. Commercial users may only move it to the trash. Admins
 * may also restore; their check also passes without data (the trash list then offers Restore) and
 * for a trashed document (its page then offers Restore).
 */
const canUpdate: Access = ({ req, data }) => {
  if (hasRole(req, 'admin')) return !data || data.deletedAt != null || isRestoring(data)
  return hasRole(req, 'commercial') && isTrashing(data)
}

/** Records who moved the participation to the trash, and refuses it once a draw selected it. */
const beforeTrashOrRestore: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'update' || !('deletedAt' in data)) return data
  if (data.deletedAt && !originalDoc?.deletedAt) {
    await assertParticipationRemovable(req, originalDoc.id)
    return { ...data, deletedBy: req.user?.collection === 'users' ? req.user.id : null }
  }
  if (!data.deletedAt) return { ...data, deletedBy: null }
  return data
}

const beforePermanentDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await assertParticipationRemovable(req, id)
}

/**
 * One accepted submission to one contest. There is no moderation (SPECIFICATION §9): a
 * participation is valid on creation, enters its period's draw pool, and is never modified. The
 * submitted name, phone, email and wilaya are kept exactly as entered.
 *
 * Staff can still remove an ineligible entry: it goes to the trash (Payload's soft delete), out of
 * lists, counts, exports and draw pools, until an admin restores it or deletes it for good.
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
  trash: true,
  hooks: { beforeChange: [beforeTrashOrRestore], beforeDelete: [beforePermanentDelete] },
  access: {
    read: isStaff,
    create: nobody,
    update: canUpdate,
    delete: canDelete,
  },
  indexes: [
    // Draw pools and per-contest lists.
    { fields: ['contest', 'submittedAt'] },
    // Entry limit per phone per draw period.
    { fields: ['contest', 'phoneNormalized', 'submittedAt'] },
  ],
  fields: [
    ...serviceOnly([
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
        fields: serviceOnly([
          { name: 'source', label: label('Canal', 'Channel', 'القناة'), type: 'text' },
          { name: 'utmSource', label: label('Source UTM', 'UTM source', 'مصدر UTM'), type: 'text' },
          {
            name: 'utmMedium',
            label: label('Support UTM', 'UTM medium', 'وسيط UTM'),
            type: 'text',
          },
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
    {
      name: 'deletedBy',
      label: label('Supprimée par', 'Deleted by', 'حُذفت من طرف'),
      type: 'relationship',
      relationTo: 'users',
      access: { update: nobodyField },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.deletedAt),
      },
    },
  ],
}
