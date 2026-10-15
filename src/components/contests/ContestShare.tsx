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

/** The contest page's share section, as a compact card. */
export async function ContestShare({ contest }: { contest: Contest }) {
  const t = await getTranslations('share')
  return (
    <section
      className="flex flex-col gap-4 rounded-card border bg-card p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"
      aria-labelledby="share-title"
    >
      <h2 id="share-title" className="text-h3">
        {t('title')}
      </h2>
      <ContestShareButtons contest={contest} />
    </section>
  )
}
