import { ArrowRight, CalendarDays } from 'lucide-react'
import Image from 'next/image'
import { getFormatter, getTranslations } from 'next-intl/server'

import { BrandMark } from '@/components/shared/BrandLogo'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/navigation'
import { contestVisual } from '@/lib/media'
import { cn } from '@/lib/utils'
import { contestPhase } from '@/modules/contests/domain/phase'
import type { Contest } from '@/payload-types'

import { ContestDates } from './ContestDates'
import { ContestCountdown, ContestStatusBadge } from './ContestStatus'

const cardClass =
  'group relative w-full overflow-hidden rounded-card border bg-card shadow-card transition-shadow duration-200 ease-brand hover:shadow-raised has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring'

/**
 * A contest in a list. The whole card is one link (the title's, stretched over it), with one focus
 * ring. `featured` lays the image and the text side by side from tablets up. `winners` names the
 * published winners, in the archive.
 */
export async function ContestCard({
  contest,
  featured = false,
  winners = [],
}: {
  contest: Contest
  featured?: boolean
  winners?: string[]
}) {
  const t = await getTranslations('contests')
  const format = await getFormatter()
  const phase = contestPhase(contest)
  const visual = contestVisual(contest)
  const prize = contest.prizes?.[0]
  const ended = phase === 'closed' || phase === 'archived'
  const action = ended
    ? winners.length > 0
      ? t('card.seeWinners')
      : t('card.seeContest')
    : phase === 'open'
      ? t('card.participate')
      : t('card.discover')

  return (
    <article className={cn(cardClass, 'flex flex-col', featured && 'md:grid md:grid-cols-12')}>
      <div
        className={cn(
          'relative aspect-[1200/630] overflow-hidden bg-secondary',
          featured && 'md:col-span-7 md:aspect-auto md:min-h-80',
        )}
      >
        {visual ? (
          <Image
            src={visual.url}
            alt=""
            fill
            sizes={
              featured
                ? '(min-width: 1152px) 640px, (min-width: 768px) 58vw, 100vw'
                : '(min-width: 1024px) 352px, (min-width: 640px) 50vw, 100vw'
            }
            className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <BrandMark className="h-16 w-auto opacity-90" />
          </div>
        )}
        {/* White on pictures, which are often brand red themselves. */}
        <ContestStatusBadge
          contest={contest}
          inverse={Boolean(visual)}
          className="absolute start-4 top-4 shadow-card"
        />
      </div>
      <div
        className={cn(
          'flex flex-1 flex-col gap-3 p-5 sm:p-6',
          featured && 'md:col-span-5 md:justify-center md:gap-4 md:p-8',
        )}
      >
        <h2 className={cn('line-clamp-3 text-h3', featured && 'md:text-h2')}>
          <Link
            href={`/concours/${contest.slug}`}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {contest.title}
          </Link>
        </h2>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-small text-muted-foreground">
            <CalendarDays aria-hidden className="size-4 shrink-0" />
            <ContestDates contest={contest} variant="range" />
          </div>
          <ContestCountdown contest={contest} className="text-primary-ink" />
        </div>
        {prize && !ended && (
          <p className="text-body">
            {t('card.toWin', {
              prize:
                prize.quantity && prize.quantity > 1
                  ? `${prize.quantity} × ${prize.title}`
                  : prize.title,
            })}
          </p>
        )}
        {winners.length > 0 && (
          <div className="flex flex-col items-start gap-2">
            <Badge variant="cream">{t('card.winnersPublished')}</Badge>
            <p className="text-small text-muted-foreground">
              {t.rich('winnersOf', {
                // Latin names in Arabic text keep their own direction.
                names: () =>
                  format.list(
                    winners.map((name, index) => <bdi key={index}>{name}</bdi>),
                    { type: 'conjunction' },
                  ),
              })}
            </p>
          </div>
        )}
        {/* Decorative: the card itself is the link. */}
        <span
          aria-hidden
          className={buttonVariants({
            variant: phase === 'open' ? 'default' : 'outline',
            size: 'sm',
            className: 'pointer-events-none mt-auto self-start',
          })}
        >
          {action}
          {/* Nudges forward on open contests, to draw the eye to taking part. */}
          <ArrowRight
            className={cn(
              'rtl:rotate-180',
              phase === 'open' && 'animate-nudge rtl:[--nudge-x:-0.25rem]',
            )}
          />
        </span>
      </div>
    </article>
  )
}

/** The shape of a card while the list loads. */
export function ContestCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border bg-card">
      <Skeleton className="aspect-[1200/630] rounded-none" />
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <Skeleton className="h-7 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="mt-2 h-10 w-32" />
      </div>
    </div>
  )
}
