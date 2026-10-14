import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { Locale } from '@/i18n/config'
import config from '@/payload.config'

import { cacheTags } from './cacheTags'
import { getPublicContest, listCurrentContests, listPastContests } from './publicContests'
import { listPublicWinners } from './publicWinners'

// Public pages read contests through these, so the database is hit once per change rather than
// once per visitor. Edits invalidate the tags (src/payload/hooks/revalidate.ts); lists also expire
// after a minute because a contest opening or closing changes them without any edit.

const listLifetime = 60

export function getCachedPublicContest(slug: string, locale: Locale) {
  return unstable_cache(
    async () => getPublicContest(await getPayload({ config }), slug, locale),
    ['public-contest', slug, locale],
    { tags: [cacheTags.contests, cacheTags.contest(slug)] },
  )()
}

export function getCachedCurrentContests(locale: Locale) {
  return unstable_cache(
    async () => listCurrentContests(await getPayload({ config }), locale),
    ['current-contests', locale],
    { tags: [cacheTags.contests], revalidate: listLifetime },
  )()
}

export function getCachedPastContests(locale: Locale) {
  return unstable_cache(
    async () => listPastContests(await getPayload({ config }), locale),
    ['past-contests', locale],
    { tags: [cacheTags.contests], revalidate: listLifetime },
  )()
}

/**
 * Winners of contests the visitor can already see; media edits also refresh them. They also expire
 * after a minute, since a re-draw voids a winner inside a transaction that commits after the
 * revalidation fires.
 */
export function getCachedPublicWinners(contestIds: number[], locale: Locale) {
  const ids = [...contestIds].sort((a, b) => a - b)
  return unstable_cache(
    async () => listPublicWinners(await getPayload({ config }), ids, locale),
    ['public-winners', ids.join(','), locale],
    { tags: [cacheTags.winners, cacheTags.contests], revalidate: listLifetime },
  )()
}

export function getCachedSettings(locale: Locale) {
  return unstable_cache(
    async () =>
      (await getPayload({ config })).findGlobal({
        slug: 'settings',
        locale,
        overrideAccess: false,
      }),
    ['settings', locale],
    { tags: [cacheTags.settings] },
  )()
}
