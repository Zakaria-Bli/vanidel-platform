import type { Payload } from 'payload'

import { defaultLocale, locales, type Locale } from '@/i18n/config'

import { publicationChecklist, type ChecklistItemId } from '../domain/checklist'
import type { ReadOptions } from './pendingDraws'

export interface IncompleteDraft {
  id: number
  /** In the requested language, or the first one filled. */
  title: string
  /** Required checklist items still missing: the draft cannot be published until they are done. */
  missing: ChecklistItemId[]
}

/** Drafts that cannot be published yet, last edited first (the publish checklist, USER_FLOWS §6). */
export async function incompleteDrafts(
  payload: Payload,
  { locale = defaultLocale, ...access }: ReadOptions = {},
): Promise<IncompleteDraft[]> {
  const { docs } = await payload.find({
    collection: 'contests',
    where: { status: { equals: 'draft' } },
    // Every language at once, as the checklist expects.
    locale: 'all',
    sort: '-updatedAt',
    limit: 20,
    depth: 0,
    ...access,
  })

  return docs.flatMap((doc) => {
    const missing = publicationChecklist(doc, locales)
      .filter((item) => item.level === 'required' && !item.ok)
      .map(({ id }) => id)
    if (missing.length === 0) return []
    const titles = (doc.title ?? {}) as unknown as Partial<Record<Locale, string>>
    const title = titles[locale] || locales.map((code) => titles[code]).find(Boolean) || ''
    return [{ id: doc.id, title, missing }]
  })
}
