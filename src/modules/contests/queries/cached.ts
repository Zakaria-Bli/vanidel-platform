import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { Locale } from '@/i18n/config'
import config from '@/payload.config'

import { cacheTags } from './cacheTags'
import { getPublicContest, listCurrentContests, listPastContests } from './publicContests'

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
