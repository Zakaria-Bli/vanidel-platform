import { env } from '@/lib/env'
import { contestVisual } from '@/lib/media'
import type { Contest } from '@/payload-types'

import { ShareButtons } from './ShareButtons'

/** Share buttons for a contest, offered once the visitor has taken part. */
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
