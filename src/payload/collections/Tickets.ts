import type { CollectionConfig } from 'payload'

import { isAdmin, isStaff, nobody } from '../access'
import { groups, label } from '../fields/label'
import { readOnly } from '../fields/readOnly'

/**
 * Small square preview for the participations list, so the admin does not load every full receipt
 * photo. Always generated (`withoutEnlargement: false`), so its file name is predictable:
 * `{name}-160x160.webp` (see removeTicketFiles).
 */
export const ticketThumbnail = { name: 'thumbnail', size: 160, extension: 'webp' } as const

/**
 * Proof-of-purchase photos. Private: files are served only through /api/tickets/file/* to staff,
 * and created only by the participation service, which re-encodes and hashes them first.
 */
export const Tickets: CollectionConfig = {
  slug: 'tickets',
  labels: {
    singular: label('Ticket', 'Ticket', 'التذكرة'),
    plural: label('Tickets', 'Tickets', 'التذاكر'),
  },
  admin: {
    hideAPIURL: true,
    // Receipts are only useful next to their participation, where the list thumbnail and the
    // winner verification panel already show them; a separate Tickets page adds nothing.
    hidden: true,
    group: groups.participations,
    defaultColumns: ['filename', 'contest', 'uploadedAt'],
  },
  access: {
    read: isStaff,
    create: nobody,
    update: nobody,
    delete: isAdmin,
  },
  // The same receipt photo can enter a contest only once (SPECIFICATION §8.1).
  indexes: [{ fields: ['contest', 'hash'], unique: true }],
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    displayPreview: true,
    hideRemoveFile: true,
    adminThumbnail: ticketThumbnail.name,
    imageSizes: [
      {
        name: ticketThumbnail.name,
        width: ticketThumbnail.size,
        height: ticketThumbnail.size,
        position: 'centre',
        withoutEnlargement: false,
        formatOptions: { format: ticketThumbnail.extension, options: { quality: 70 } },
      },
    ],
  },
  fields: readOnly([
    {
      name: 'contest',
      label: label('Concours', 'Contest', 'المسابقة'),
      type: 'relationship',
      relationTo: 'contests',
      required: true,
    },
    {
      name: 'hash',
      label: label('Empreinte SHA-256', 'SHA-256 hash', 'بصمة SHA-256'),
      type: 'text',
      required: true,
    },
    {
      name: 'uploadedAt',
      label: label('Reçu le', 'Uploaded at', 'رُفعت في'),
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
  ]),
}
