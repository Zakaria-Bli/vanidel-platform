import type { CollectionConfig } from 'payload'

import { anyone, isAdmin, isStaff } from '../access'
import { groups, label } from '../fields/label'
import { revalidateMediaAfterChange, revalidateMediaAfterDelete } from '../hooks/revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: label('Média', 'Media'), plural: label('Médias', 'Media') },
  admin: {
    group: groups.content,
  },
  // Public campaign assets only. Proof-of-purchase images live in the private `tickets` collection.
  access: {
    read: anyone,
    create: isStaff,
    update: isStaff,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [revalidateMediaAfterChange],
    afterDelete: [revalidateMediaAfterDelete],
  },
  fields: [
    {
      name: 'alt',
      label: label('Texte alternatif', 'Alt text'),
      type: 'text',
      required: true,
      localized: true,
    },
  ],
  upload: {
    // Images for visuals, PDF for contest regulations.
    mimeTypes: ['image/*', 'application/pdf'],
    imageSizes: [
      { name: 'hero', width: 1600, formatOptions: { format: 'webp', options: { quality: 80 } } },
      // Open Graph / social preview size.
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
  },
}
