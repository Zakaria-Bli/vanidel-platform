import { ChevronDown, Trophy } from 'lucide-react'
import Image from 'next/image'
import { getFormatter, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import type { Locale } from '@/i18n/config'
import { imageSize } from '@/lib/media'
import { cn } from '@/lib/utils'
import { winnersByPeriod, type PublicWinner } from '@/modules/contests/domain/publicWinners'
import { getCachedPublicWinners } from '@/modules/contests/queries/cached'
import type { Media } from '@/payload-types'

import { winnersAnchor } from './anchors'
import { collapsiblePanelClass, WinnersDisclosure } from './WinnersDisclosure'

/**
 * Published winners by draw period, latest first (SPECIFICATION §11), on a blue band below the
 * form. A draw can have up to 25 winners, so the list is folded under a header with the totals,
 * and past draws fold again inside it, the latest one open. It loads its own data so the page can
 * stream it. Before the first draw it shows nothing while the contest runs, and once the contest
 * has ended it says the winners are coming.
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

  if (winners.length === 0) {
    return (
      <WinnersBand>
        <WinnersHeading title={t('winners')} summary={t('winnersSoon')} />
      </WinnersBand>
    )
  }

  const periods = winnersByPeriod(winners)
  const summary = [
    t('winnersCount', { count: winners.length }),
    periods.length > 1 && t('winnersDraws', { draws: periods.length }),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <WinnersBand>
      <WinnersDisclosure
        header={<WinnersHeading title={t('winners')} summary={summary} />}
        showLabel={t('winnersShow')}
        hideLabel={t('winnersHide')}
      >
        {periods.length === 1 ? (
          <div className="flex flex-col gap-4">
            <h3 className="text-label text-white/90">
              {t('winnersPeriod', { range: range(periods[0].periodStart, periods[0].periodEnd) })}
            </h3>
            <PeriodWinners winners={periods[0].winners} />
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {periods.map((period, index) => (
              <li key={period.periodStart}>
                <Collapsible
                  defaultOpen={index === 0}
                  className="rounded-card bg-white/8 ring-1 ring-white/15"
                >
                  <h3>
                    <CollapsibleTrigger className="group/period flex min-h-14 w-full items-center gap-3 rounded-card px-4 py-3 text-start text-label transition-colors duration-150 hover:bg-white/5 sm:px-5">
                      <span className="flex-1">
                        {t('winnersPeriod', { range: range(period.periodStart, period.periodEnd) })}
                      </span>
                      <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 text-small font-normal">
                        {t('winnersCount', { count: period.winners.length })}
                      </span>
                      <ChevronDown
                        aria-hidden
                        className="size-5 shrink-0 transition-transform duration-200 ease-brand group-data-panel-open/period:rotate-180"
                      />
                    </CollapsibleTrigger>
                  </h3>
                  <CollapsibleContent hiddenUntilFound className={collapsiblePanelClass}>
                    <div className="px-4 pt-1 pb-4 sm:px-5 sm:pb-5">
                      <PeriodWinners winners={period.winners} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </li>
            ))}
          </ul>
        )}
      </WinnersDisclosure>
    </WinnersBand>
  )
}

function WinnersBand({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      id={winnersAnchor}
      aria-labelledby="winners-title"
      className={cn(
        'scroll-mt-24 rounded-band bg-brand-blue-strong px-5 py-7 text-white [--ring:var(--primary-foreground)] sm:px-8 md:px-12 md:py-10',
        className,
      )}
    >
      {children}
    </section>
  )
}

function WinnersHeading({ title, summary }: { title: string; summary: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex-center size-12 shrink-0 rounded-full bg-white text-brand-blue-ink shadow-card md:size-14">
        <Trophy aria-hidden className="size-6 md:size-7" />
      </span>
      <div className="flex flex-col gap-0.5">
        <h2 id="winners-title" className="text-h2">
          {title}
        </h2>
        <p className="text-body text-white/85">{summary}</p>
      </div>
    </div>
  )
}

/**
 * One draw's winners: a compact numbered list, in rank order, then the photos and videos some
 * winners agreed to share, as cards.
 */
function PeriodWinners({ winners }: { winners: PublicWinner<Media>[] }) {
  const withMedia = winners.filter((winner) => winner.media && hasShowableMedia(winner.media))

  return (
    <div className="flex flex-col gap-5">
      <ol className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        {winners.map((winner, index) => (
          <li
            key={winner.id}
            className="flex min-w-0 items-center gap-2.5 rounded-control bg-white px-2.5 py-2 text-card-foreground shadow-card sm:gap-3 sm:px-3 sm:py-2.5"
          >
            <span
              aria-hidden
              className="flex-center size-8 shrink-0 rounded-full bg-secondary text-label text-primary-ink tabular-nums"
            >
              {index + 1}
            </span>
            <p dir="auto" className="min-w-0 truncate text-label">
              <bdi>{winner.name}</bdi>
            </p>
          </li>
        ))}
      </ol>
      {withMedia.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withMedia.map((winner) => (
            <li
              key={winner.id}
              className="flex flex-col overflow-hidden rounded-card bg-card text-card-foreground shadow-card"
            >
              <WinnerMedia media={winner.media as Media} />
              <p dir="auto" className="px-4 py-3 text-label">
                <bdi>{winner.name}</bdi>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Holds the band's place while the winners load, once the contest has ended. */
export function WinnersSkeleton() {
  return (
    <WinnersBand>
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full bg-white/20 md:size-14" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48 bg-white/20" />
          <Skeleton className="h-4 w-32 bg-white/20" />
        </div>
      </div>
    </WinnersBand>
  )
}

function hasShowableMedia(media: Media) {
  if (media.mimeType?.startsWith('video/')) return Boolean(media.url)
  return Boolean(media.mimeType?.startsWith('image/') && imageSize(media, 'og'))
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
        className="aspect-video w-full bg-muted"
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
      className="aspect-[1200/630] w-full object-cover"
    />
  )
}
