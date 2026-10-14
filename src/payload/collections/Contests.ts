import {
  ValidationError,
  type CollectionBeforeChangeHook,
  type CollectionConfig,
  type FieldHook,
} from 'payload'

import { locales } from '@/i18n/config'
import { weekdays } from '@/modules/contests/domain/drawPeriod'
import { duplicateSlug, duplicateSlugPrefix } from '@/modules/contests/domain/duplicate'
import { contestStatuses } from '@/modules/contests/domain/phase'
import { missingTranslations, valueAt } from '@/modules/contests/domain/translations'

import { hasRole, isAdmin, isStaff } from '../access'
import { integer } from '../fields/integer'
import { groups, label } from '../fields/label'
import { contestChecklistEndpoint } from '../endpoints/checklist'
import { contestReportEndpoint } from '../endpoints/reports'
import { revalidateContestAfterChange, revalidateContestAfterDelete } from '../hooks/revalidate'
import { consentTypeLabels, consentTypes } from './ConsentRecords'

const weekdayLabels = {
  sunday: label('Dimanche', 'Sunday', 'الأحد'),
  monday: label('Lundi', 'Monday', 'الاثنين'),
  tuesday: label('Mardi', 'Tuesday', 'الثلاثاء'),
  wednesday: label('Mercredi', 'Wednesday', 'الأربعاء'),
  thursday: label('Jeudi', 'Thursday', 'الخميس'),
  friday: label('Vendredi', 'Friday', 'الجمعة'),
  saturday: label('Samedi', 'Saturday', 'السبت'),
}

export const reservedSlugs = ['archives']

/** Localized fields that must be filled in every locale before a contest goes public. */
export const requiredTranslations = ['title', 'description', 'seo.title'] as const

/** The same for array rows: every step, prize title and consent text is shown to participants. */
export const requiredRowTranslations = {
  steps: ['text'],
  prizes: ['title'],
  consents: ['label'],
} as const

type Row = Record<string, unknown> & { id?: unknown }

/**
 * Refuses to publish or archive a contest while a required field is empty in some locale; with
 * `fallback: true`, Arabic pages would otherwise silently show the French text. The admin saves
 * one locale at a time, so the other locales are read from the stored document.
 */
const requireTranslationsWhenPublic: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  const status = data.status ?? originalDoc?.status
  if (status === 'draft') return data

  const stored =
    operation === 'update' && originalDoc?.id
      ? await req.payload.findByID({
          collection: 'contests',
          id: originalDoc.id,
          locale: 'all',
          depth: 0,
          req,
        })
      : {}

  // Build the shape of a `locale: 'all'` read: stored values, with the locale being saved
  // replaced by the incoming one.
  const editedLocale = req.locale && req.locale !== 'all' ? req.locale : null
  const mergeValue = (storedValues: unknown, incoming: unknown) => {
    const values = { ...(storedValues as Record<string, unknown> | undefined) }
    if (editedLocale) {
      if (incoming !== undefined) values[editedLocale] = incoming
    } else if (incoming && typeof incoming === 'object') {
      Object.assign(values, incoming)
    }
    return values
  }

  const merged: Record<string, unknown> = {}
  for (const path of requiredTranslations) {
    const keys = path.split('.')
    const parent = keys
      .slice(0, -1)
      .reduce<Record<string, unknown>>(
        (node, key) => (node[key] ??= {}) as Record<string, unknown>,
        merged,
      )
    parent[keys[keys.length - 1]] = mergeValue(valueAt(stored, path), valueAt(data, path))
  }

  // The saved rows decide which rows exist (rows can be added or removed in this save); stored
  // rows, matched by ID, supply their other languages. A new row has only the edited language.
  for (const [array, fields] of Object.entries(requiredRowTranslations)) {
    const storedRows = (valueAt(stored, array) as Row[] | undefined) ?? []
    const incomingRows = valueAt(data, array) as Row[] | undefined
    merged[array] = (incomingRows ?? storedRows).map((row) => {
      const storedRow = storedRows.find(({ id }) => id !== undefined && id === row.id)
      return Object.fromEntries(
        fields.map((field) => [
          field,
          incomingRows ? mergeValue(storedRow?.[field], row[field]) : row[field],
        ]),
      )
    })
  }

  const paths = [
    ...requiredTranslations,
    ...Object.entries(requiredRowTranslations).flatMap(([array, fields]) =>
      fields.map((field) => `${array}.*.${field}`),
    ),
  ]
  const missing = missingTranslations(merged, paths, locales)
  if (((merged.steps as unknown[] | undefined) ?? []).length === 0)
    missing.push('steps (at least one)')
  if (missing.length > 0) {
    throw new ValidationError({
      collection: 'contests',
      errors: [
        {
          path: 'status',
          message: `Complete every language before publishing. Missing: ${missing.join(', ')}`,
        },
      ],
      req,
    })
  }
  return data
}

/** A duplicated contest gets a free slug (the original's is unique and printed on QR codes). */
const copySlug: FieldHook = async ({ value, req }) => {
  if (typeof value !== 'string') return value
  const { docs } = await req.payload.find({
    collection: 'contests',
    where: { slug: { like: duplicateSlugPrefix(value) } },
    select: { slug: true },
    pagination: false,
    depth: 0,
    req,
  })
  return duplicateSlug(value, new Set(docs.map(({ slug }) => slug)))
}

export const Contests: CollectionConfig = {
  slug: 'contests',
  labels: {
    singular: label('Concours', 'Contest', 'المسابقة'),
    plural: label('Concours', 'Contests', 'المسابقات'),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'startAt', 'endAt'],
    group: groups.contests,
    // The Preview button: the contest page in the language being edited, drafts included.
    preview: (doc, { locale }) =>
      typeof doc.id === 'number' ? `/api/preview?contest=${doc.id}&locale=${locale}` : null,
  },
  endpoints: [contestReportEndpoint, contestChecklistEndpoint],
  access: {
    // The public sees published and archived contests; drafts stay in the back office.
    read: ({ req }) =>
      hasRole(req, 'admin', 'commercial') || { status: { in: ['published', 'archived'] } },
    create: isStaff,
    update: isStaff,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [requireTranslationsWhenPublic],
    afterChange: [revalidateContestAfterChange],
    afterDelete: [revalidateContestAfterDelete],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: label('Contenu', 'Content', 'المحتوى'),
          fields: [
            {
              name: 'title',
              label: label('Titre', 'Title', 'العنوان'),
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'description',
              label: label('Description', 'Description', 'الوصف'),
              type: 'richText',
              localized: true,
            },
            {
              name: 'steps',
              label: label(
                'Comment participer (étapes)',
                'How to take part (steps)',
                'كيفية المشاركة (الخطوات)',
              ),
              type: 'array',
              admin: {
                description: label(
                  'Affichées numérotées, dans cet ordre. Au moins une étape pour publier.',
                  'Shown numbered, in this order. At least one step to publish.',
                  'تُعرض مرقّمة بهذا الترتيب. يلزم خطوة واحدة على الأقل للنشر.',
                ),
              },
              fields: [
                {
                  name: 'text',
                  label: label('Étape', 'Step', 'الخطوة'),
                  type: 'textarea',
                  required: true,
                  localized: true,
                },
              ],
            },
            {
              name: 'heroMedia',
              label: label('Visuel principal', 'Hero image', 'الصورة الرئيسية'),
              type: 'upload',
              relationTo: 'media',
              filterOptions: { mimeType: { contains: 'image' } },
            },
            {
              name: 'regulation',
              label: label('Règlement (PDF)', 'Regulation (PDF)', 'النظام (PDF)'),
              type: 'upload',
              relationTo: 'media',
              localized: true,
              filterOptions: { mimeType: { equals: 'application/pdf' } },
            },
            {
              name: 'prizes',
              label: label('Lots', 'Prizes', 'الجوائز'),
              type: 'array',
              fields: [
                {
                  name: 'title',
                  label: label('Titre', 'Title', 'العنوان'),
                  type: 'text',
                  required: true,
                  localized: true,
                },
                {
                  name: 'description',
                  label: label('Description', 'Description', 'الوصف'),
                  type: 'textarea',
                  localized: true,
                },
                {
                  name: 'media',
                  label: label('Image', 'Image', 'الصورة'),
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: { mimeType: { contains: 'image' } },
                },
                {
                  name: 'quantity',
                  label: label('Quantité', 'Quantity', 'الكمية'),
                  type: 'number',
                  min: 1,
                  admin: { step: 1 },
                  validate: integer,
                },
              ],
            },
          ],
        },
        {
          label: label('Participation', 'Participation', 'المشاركة'),
          fields: [
            {
              name: 'form',
              label: label('Formulaire', 'Form', 'الاستمارة'),
              type: 'group',
              admin: {
                description: label(
                  'Le nom, le téléphone et la photo du ticket sont toujours demandés.',
                  'Name, phone and ticket photo are always required.',
                  'الاسم والهاتف وصورة التذكرة مطلوبة دائمًا.',
                ),
              },
              fields: [
                {
                  name: 'email',
                  label: label('E-mail', 'Email', 'البريد الإلكتروني'),
                  type: 'select',
                  required: true,
                  defaultValue: 'optional',
                  options: [
                    { label: label('Non demandé', 'Not asked', 'غير مطلوب'), value: 'off' },
                    { label: label('Facultatif', 'Optional', 'اختياري'), value: 'optional' },
                    { label: label('Obligatoire', 'Required', 'إلزامي'), value: 'required' },
                  ],
                },
                {
                  name: 'wilayaRequired',
                  label: label('Wilaya obligatoire', 'Wilaya required', 'الولاية إلزامية'),
                  type: 'checkbox',
                  defaultValue: true,
                },
              ],
            },
            {
              name: 'entryLimitPerPhone',
              label: label(
                'Participations max. par téléphone et par période',
                'Max entries per phone per draw period',
                'الحد الأقصى للمشاركات لكل هاتف في كل فترة سحب',
              ),
              type: 'number',
              required: true,
              defaultValue: 1,
              min: 1,
              admin: { step: 1 },
              validate: integer,
            },
            {
              name: 'consents',
              label: label('Consentements', 'Consents', 'الموافقات'),
              type: 'array',
              fields: [
                {
                  name: 'type',
                  label: label('Type', 'Type', 'النوع'),
                  type: 'select',
                  required: true,
                  options: consentTypes.map((value) => ({
                    value,
                    label: consentTypeLabels[value],
                  })),
                },
                {
                  name: 'required',
                  label: label('Obligatoire', 'Required', 'إلزامي'),
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'label',
                  label: label('Texte affiché', 'Displayed text', 'النص المعروض'),
                  type: 'textarea',
                  required: true,
                  localized: true,
                },
                {
                  name: 'textVersion',
                  label: label('Version du texte', 'Text version', 'إصدار النص'),
                  type: 'text',
                  required: true,
                  admin: {
                    description: label(
                      'À changer dès que le texte change, pour garder la preuve du texte accepté.',
                      'Change it whenever the text changes, to keep evidence of the accepted text.',
                      'غيّره كلما تغيّر النص، للاحتفاظ بإثبات النص المقبول.',
                    ),
                  },
                },
              ],
            },
          ],
        },
        {
          label: label('Tirages', 'Draws', 'السحوبات'),
          fields: [
            {
              name: 'draw',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'periodDays',
                  label: label(
                    'Durée d’une période (jours)',
                    'Period length (days)',
                    'مدة الفترة (بالأيام)',
                  ),
                  type: 'number',
                  required: true,
                  defaultValue: 7,
                  min: 1,
                  admin: { step: 1 },
                  validate: integer,
                },
                {
                  name: 'periodStartDay',
                  label: label(
                    'Premier jour de la période',
                    'Period start day',
                    'يوم بداية الفترة',
                  ),
                  type: 'select',
                  options: weekdays.map((value) => ({ value, label: weekdayLabels[value] })),
                  admin: {
                    description: label(
                      'Heure d’Alger, à minuit. Par défaut : le jour de début du concours.',
                      'Algiers time, at midnight. Defaults to the contest start day.',
                      'بتوقيت الجزائر، عند منتصف الليل. افتراضيًا: يوم بداية المسابقة.',
                    ),
                  },
                },
                {
                  name: 'winnersPerDraw',
                  label: label('Gagnants par tirage', 'Winners per draw', 'عدد الفائزين في كل سحب'),
                  type: 'number',
                  required: true,
                  defaultValue: 1,
                  min: 1,
                  admin: { step: 1 },
                  validate: integer,
                },
              ],
            },
          ],
        },
        {
          label: label('Partage et SEO', 'Sharing and SEO', 'المشاركة وتحسين محركات البحث'),
          fields: [
            {
              name: 'seo',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'title',
                  label: label('Titre SEO', 'SEO title', 'عنوان تحسين محركات البحث'),
                  type: 'text',
                  localized: true,
                },
                {
                  name: 'description',
                  label: label('Description SEO', 'SEO description', 'وصف تحسين محركات البحث'),
                  type: 'textarea',
                  localized: true,
                },
              ],
            },
            {
              name: 'shareMedia',
              label: label(
                'Image de partage (1200×630)',
                'Share image (1200×630)',
                'صورة المشاركة (1200×630)',
              ),
              type: 'upload',
              relationTo: 'media',
              filterOptions: { mimeType: { contains: 'image' } },
            },
          ],
        },
        {
          label: label('Rapport', 'Report', 'التقرير'),
          fields: [
            {
              name: 'report',
              type: 'ui',
              label: label('Rapport', 'Report', 'التقرير'),
              admin: {
                components: { Field: '/payload/components/ContestReportField#ContestReportField' },
              },
            },
          ],
        },
      ],
    },
    {
      name: 'checklist',
      type: 'ui',
      label: label('Avant de publier', 'Before publishing', 'قبل النشر'),
      admin: {
        position: 'sidebar',
        components: { Field: '/payload/components/ContestChecklistField#ContestChecklistField' },
      },
    },
    {
      name: 'slug',
      label: label('Identifiant URL', 'URL slug', 'معرّف الرابط'),
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeDuplicate: [copySlug] },
      admin: {
        position: 'sidebar',
        description: label(
          'Utilisé dans /concours/{slug}, imprimé sur les QR codes : ne plus le changer après impression.',
          'Used in /concours/{slug}, printed on QR codes: do not change it once printed.',
          'يُستخدم في /concours/{slug} ويُطبع على رموز QR: لا تغيّره بعد الطباعة.',
        ),
      },
      validate: (value: unknown) => {
        if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
          return 'Lowercase letters, digits and dashes only.'
        }
        // /concours/archives is the archive page, so no contest can use that slug.
        return reservedSlugs.includes(value) ? `"${value}" is reserved.` : true
      },
    },
    {
      name: 'status',
      label: label('Statut', 'Status', 'الحالة'),
      type: 'select',
      required: true,
      defaultValue: 'draft',
      // A copy starts hidden, whatever the original's status.
      hooks: { beforeDuplicate: [() => 'draft'] },
      options: contestStatuses.map((value) => ({
        value,
        label: {
          draft: label('Brouillon', 'Draft', 'مسودة'),
          published: label('Publié', 'Published', 'منشور'),
          archived: label('Archivé', 'Archived', 'مؤرشف'),
        }[value],
      })),
      admin: {
        position: 'sidebar',
        description: label(
          'Publié : ouvert entre les dates de début et de fin.',
          'Published: open between the start and end dates.',
          'منشورة: مفتوحة بين تاريخي البداية والنهاية.',
        ),
      },
    },
    {
      name: 'startAt',
      label: label('Début', 'Start', 'البداية'),
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' },
      },
    },
    {
      name: 'endAt',
      label: label('Fin', 'End', 'النهاية'),
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' },
      },
      validate: (value: unknown, { siblingData }: { siblingData: { startAt?: unknown } }) => {
        if (!value) return 'Required.'
        const start = siblingData.startAt ? new Date(siblingData.startAt as string) : null
        return start && new Date(value as string) <= start ? 'Must be after the start.' : true
      },
    },
  ],
}
