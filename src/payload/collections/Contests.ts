import { ValidationError, type CollectionBeforeChangeHook, type CollectionConfig } from 'payload'

import { locales } from '@/i18n/config'
import { weekdays } from '@/modules/contests/domain/drawPeriod'
import { contestStatuses } from '@/modules/contests/domain/phase'
import { missingTranslations, valueAt } from '@/modules/contests/domain/translations'

import { hasRole, isAdmin, isStaff } from '../access'
import { label } from '../fields/label'

/** Localized fields that must be filled in every locale before a contest goes public. */
export const requiredTranslations = [
  'title',
  'description',
  'participationInstructions',
  'seo.title',
] as const

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

  // Same shape as a `locale: 'all'` read: stored values, with the locale being saved replaced by
  // the incoming one.
  const editedLocale = req.locale && req.locale !== 'all' ? req.locale : null
  const merged: Record<string, unknown> = {}
  for (const path of requiredTranslations) {
    const values = { ...(valueAt(stored, path) as Record<string, unknown> | undefined) }
    const incoming = valueAt(data, path)
    if (editedLocale) {
      if (incoming !== undefined) values[editedLocale] = incoming
    } else if (incoming && typeof incoming === 'object') {
      Object.assign(values, incoming)
    }
    const keys = path.split('.')
    const parent = keys
      .slice(0, -1)
      .reduce<Record<string, unknown>>(
        (node, key) => (node[key] ??= {}) as Record<string, unknown>,
        merged,
      )
    parent[keys[keys.length - 1]] = values
  }

  const missing = missingTranslations(merged, requiredTranslations, locales)
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

export const Contests: CollectionConfig = {
  slug: 'contests',
  labels: { singular: label('Concours', 'Contest'), plural: label('Concours', 'Contests') },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'startAt', 'endAt'],
    group: label('Concours', 'Contests'),
  },
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
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: label('Contenu', 'Content'),
          fields: [
            {
              name: 'title',
              label: label('Titre', 'Title'),
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'description',
              label: label('Description', 'Description'),
              type: 'richText',
              localized: true,
            },
            {
              name: 'participationInstructions',
              label: label('Comment participer', 'How to take part'),
              type: 'richText',
              localized: true,
            },
            {
              name: 'heroMedia',
              label: label('Visuel principal', 'Hero image'),
              type: 'upload',
              relationTo: 'media',
              filterOptions: { mimeType: { contains: 'image' } },
            },
            {
              name: 'regulation',
              label: label('Règlement (PDF)', 'Regulation (PDF)'),
              type: 'upload',
              relationTo: 'media',
              localized: true,
              filterOptions: { mimeType: { equals: 'application/pdf' } },
            },
            {
              name: 'prizes',
              label: label('Lots', 'Prizes'),
              type: 'array',
              fields: [
                {
                  name: 'title',
                  label: label('Titre', 'Title'),
                  type: 'text',
                  required: true,
                  localized: true,
                },
                {
                  name: 'description',
                  label: label('Description', 'Description'),
                  type: 'textarea',
                  localized: true,
                },
                {
                  name: 'media',
                  label: label('Image', 'Image'),
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: { mimeType: { contains: 'image' } },
                },
                {
                  name: 'quantity',
                  label: label('Quantité', 'Quantity'),
                  type: 'number',
                  min: 1,
                  admin: { step: 1 },
                },
              ],
            },
          ],
        },
        {
          label: label('Participation', 'Participation'),
          fields: [
            {
              name: 'form',
              label: label('Formulaire', 'Form'),
              type: 'group',
              admin: {
                description: label(
                  'Le nom, le téléphone et la photo du ticket sont toujours demandés.',
                  'Name, phone and ticket photo are always required.',
                ),
              },
              fields: [
                {
                  name: 'email',
                  label: label('E-mail', 'Email'),
                  type: 'select',
                  required: true,
                  defaultValue: 'off',
                  options: [
                    { label: label('Non demandé', 'Not asked'), value: 'off' },
                    { label: label('Facultatif', 'Optional'), value: 'optional' },
                    { label: label('Obligatoire', 'Required'), value: 'required' },
                  ],
                },
                {
                  name: 'wilayaRequired',
                  label: label('Wilaya obligatoire', 'Wilaya required'),
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
              ),
              type: 'number',
              required: true,
              defaultValue: 1,
              min: 1,
              admin: { step: 1 },
            },
            {
              name: 'consents',
              label: label('Consentements', 'Consents'),
              type: 'array',
              fields: [
                {
                  name: 'type',
                  label: label('Type', 'Type'),
                  type: 'select',
                  required: true,
                  options: [
                    { label: label('Règlement', 'Regulation'), value: 'regulation' },
                    { label: label('Marketing', 'Marketing'), value: 'marketing' },
                  ],
                },
                {
                  name: 'required',
                  label: label('Obligatoire', 'Required'),
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'label',
                  label: label('Texte affiché', 'Displayed text'),
                  type: 'textarea',
                  required: true,
                  localized: true,
                },
                {
                  name: 'textVersion',
                  label: label('Version du texte', 'Text version'),
                  type: 'text',
                  required: true,
                  admin: {
                    description: label(
                      'À changer dès que le texte change, pour garder la preuve du texte accepté.',
                      'Change it whenever the text changes, to keep evidence of the accepted text.',
                    ),
                  },
                },
              ],
            },
          ],
        },
        {
          label: label('Tirages', 'Draws'),
          fields: [
            {
              name: 'draw',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'periodDays',
                  label: label('Durée d’une période (jours)', 'Period length (days)'),
                  type: 'number',
                  required: true,
                  defaultValue: 7,
                  min: 1,
                  admin: { step: 1 },
                },
                {
                  name: 'periodStartDay',
                  label: label('Premier jour de la période', 'Period start day'),
                  type: 'select',
                  options: weekdays.map((value) => ({ label: value, value })),
                  admin: {
                    description: label(
                      'Heure d’Alger, à minuit. Par défaut : le jour de début du concours.',
                      'Algiers time, at midnight. Defaults to the contest start day.',
                    ),
                  },
                },
                {
                  name: 'winnersPerDraw',
                  label: label('Gagnants par tirage', 'Winners per draw'),
                  type: 'number',
                  required: true,
                  defaultValue: 1,
                  min: 1,
                  admin: { step: 1 },
                },
              ],
            },
          ],
        },
        {
          label: label('Partage et SEO', 'Sharing and SEO'),
          fields: [
            {
              name: 'seo',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'title',
                  label: label('Titre SEO', 'SEO title'),
                  type: 'text',
                  localized: true,
                },
                {
                  name: 'description',
                  label: label('Description SEO', 'SEO description'),
                  type: 'textarea',
                  localized: true,
                },
              ],
            },
            {
              name: 'shareMedia',
              label: label('Image de partage (1200×630)', 'Share image (1200×630)'),
              type: 'upload',
              relationTo: 'media',
              filterOptions: { mimeType: { contains: 'image' } },
            },
          ],
        },
      ],
    },
    {
      name: 'slug',
      label: label('Identifiant URL', 'URL slug'),
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: label(
          'Utilisé dans /concours/{slug}, imprimé sur les QR codes : ne plus le changer après impression.',
          'Used in /concours/{slug}, printed on QR codes: do not change it once printed.',
        ),
      },
      validate: (value: unknown) =>
        typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
          ? true
          : 'Lowercase letters, digits and dashes only.',
    },
    {
      name: 'status',
      label: label('Statut', 'Status'),
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: contestStatuses.map((value) => ({
        value,
        label: {
          draft: label('Brouillon', 'Draft'),
          published: label('Publié', 'Published'),
          archived: label('Archivé', 'Archived'),
        }[value],
      })),
      admin: {
        position: 'sidebar',
        description: label(
          'Publié : ouvert entre les dates de début et de fin.',
          'Published: open between the start and end dates.',
        ),
      },
    },
    {
      name: 'startAt',
      label: label('Début', 'Start'),
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' },
      },
    },
    {
      name: 'endAt',
      label: label('Fin', 'End'),
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
