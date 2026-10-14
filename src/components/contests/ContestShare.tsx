import { getTranslations } from 'next-intl/server'

import { env } from '@/lib/env'
import { contestVisual } from '@/lib/media'
import type { Contest } from '@/payload-types'

import { ShareButtons } from './ShareButtons'

/** Share buttons for a contest, with its ready-made visual. */
export function ContestShareButtons({ contest }: { contest: Contest }) {
  return (
    <ShareButtons
      siteUrl={env.SITE_URL}
      slug={contest.slug}
      title={contest.title}
      visual={contestVisual(contest)}
    />
  )
}

/** The contest page's share section. */
export async function ContestShare({ contest }: { contest: Contest }) {
  const t = await getTranslations('share')
  return (
    <section className="flex flex-col gap-3" aria-labelledby="share-title">
      <h2 id="share-title">{t('title')}</h2>
      <ContestShareButtons contest={contest} />
    </section>
  )
}
