import Image from 'next/image'
import { getFormatter, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import type { Locale } from '@/i18n/config'
import { imageSize } from '@/lib/media'
import { cn } from '@/lib/utils'
import { winnersByPeriod } from '@/modules/contests/domain/publicWinners'
import { getCachedPublicWinners } from '@/modules/contests/queries/cached'
import type { Media } from '@/payload-types'

import { winnersAnchor } from './anchors'

/**
 * Published winners by draw period, latest first (SPECIFICATION §11), on a blue band. It loads its
 * own data so the page can stream it. Before the first draw it shows nothing while the contest
 * runs, and once the contest has ended it says the winners are coming.
 */
export async function ContestWinners({
  contestId,
  locale,
  ended,
}: {
  contestId: number
  locale: Locale
  ended: boolean
}) {
  const winners = await getCachedPublicWinners([contestId], locale)
  if (winners.length === 0 && !ended) return null
  const t = await getTranslations('contests')
  const format = await getFormatter()
  // Periods end exclusively at midnight; the last day shown is the one before.
  const range = (start: string, end: string) =>
    format.dateTimeRange(new Date(start), new Date(Date.parse(end) - 1), { dateStyle: 'long' })

  return (
    <WinnersBand>
      <h2 id="winners-title">{t('winners')}</h2>
      {winners.length === 0 && <p className="text-body-lg">{t('winnersSoon')}</p>}
      {winnersByPeriod(winners).map((period) => (
        <div key={period.periodStart} className="flex flex-col gap-3">
          <h3 className="text-label">
            {t('winnersPeriod', { range: range(period.periodStart, period.periodEnd) })}
          </h3>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {period.winners.map((winner) => (
              <li
                key={winner.id}
                className="flex flex-col gap-3 rounded-card bg-card p-4 text-card-foreground shadow-card"
              >
                {winner.media && <WinnerMedia media={winner.media} />}
                <p dir="auto" className="text-h3">
                  <bdi>{winner.name}</bdi>
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </WinnersBand>
  )
}

function WinnersBand({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      id={winnersAnchor}
      aria-labelledby="winners-title"
      className={cn(
        'flex scroll-mt-24 flex-col gap-6 rounded-band bg-brand-blue-strong px-5 py-8 text-white [--ring:var(--primary-foreground)] sm:px-8 md:px-12 md:py-12',
        className,
      )}
    >
      {children}
    </section>
  )
}

/** Holds the band's place while the winners load, once the contest has ended. */
export function WinnersSkeleton() {
  return (
    <WinnersBand>
      <Skeleton className="h-9 w-48 bg-white/20" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-24 rounded-card bg-white/20" />
        ))}
      </div>
    </WinnersBand>
  )
}

function WinnerMedia({ media }: { media: Media }) {
  if (media.mimeType?.startsWith('video/') && media.url) {
    return (
      <video
        src={media.url}
        controls
        playsInline
        preload="metadata"
        aria-label={media.alt}
        className="aspect-video w-full rounded-lg bg-muted"
      />
    )
  }
  const image = media.mimeType?.startsWith('image/') ? imageSize(media, 'og') : null
  if (!image) return null
  return (
    <Image
      src={image.url}
      width={image.width}
      height={image.height}
      alt={media.alt}
      sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
      className="aspect-[1200/630] w-full rounded-lg object-cover"
    />
  )
}
