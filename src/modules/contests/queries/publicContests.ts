import type { Payload, Where } from 'payload'

import type { Locale } from '@/i18n/config'
import type { Contest } from '@/payload-types'

// Public pages read contests as an anonymous visitor (`overrideAccess: false`), so the contests
// read access is what keeps drafts out of them.
const asVisitor = { overrideAccess: false, depth: 1 } as const

/** A published or archived contest by slug, or null (including for drafts). */
export async function getPublicContest(
  payload: Payload,
  slug: string,
  locale: Locale,
): Promise<Contest | null> {
  const { docs } = await payload.find({
    collection: 'contests',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
    ...asVisitor,
  })
  return docs[0] ?? null
}

/** Published contests that are open or not yet started, soonest first. */
export async function listCurrentContests(
  payload: Payload,
  locale: Locale,
  now: Date = new Date(),
): Promise<Contest[]> {
  const { docs } = await payload.find({
    collection: 'contests',
    where: { status: { equals: 'published' }, endAt: { greater_than: now.toISOString() } },
    sort: 'startAt',
    locale,
    pagination: false,
    ...asVisitor,
  })
  return docs
}

/** Past contests, most recent first: archived ones and published ones that have ended. */
export async function listPastContests(
  payload: Payload,
  locale: Locale,
  now: Date = new Date(),
): Promise<Contest[]> {
  const ended: Where = {
    or: [
      { status: { equals: 'archived' } },
      {
        and: [
          { status: { equals: 'published' } },
          { endAt: { less_than_equal: now.toISOString() } },
        ],
      },
    ],
  }
  const { docs } = await payload.find({
    collection: 'contests',
    where: ended,
    sort: '-endAt',
    locale,
    pagination: false,
    ...asVisitor,
  })
  return docs
}
