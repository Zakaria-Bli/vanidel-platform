import { CalendarDays, FileText, Gift } from 'lucide-react'
import Image from 'next/image'
import { getFormatter, getTranslations } from 'next-intl/server'

import { Button, buttonVariants } from '@/components/ui/button'
import { imageSize, populated } from '@/lib/media'
import { cn } from '@/lib/utils'
import { contestPhase } from '@/modules/contests/domain/phase'
import type { Contest } from '@/payload-types'

import { participationAnchor, winnersAnchor } from './anchors'
import { ContestDates } from './ContestDates'
import { ContestCountdown, ContestStatusBadge } from './ContestStatus'

/** Marks the hero's participation button, which the mobile participate bar watches. */
export const heroActionAttribute = 'data-hero-action'

/**
 * The top of a contest page: its image beside a panel (stacked below 1024 px) with the status,
 * title, dates, first prize and the actions. Without an image the panel becomes a full red band,
 * so the page never opens on a blank area.
 */
export async function ContestHero({ contest }: { contest: Contest }) {
  const t = await getTranslations('contests')
  const format = await getFormatter()
  const phase = contestPhase(contest)
  const hero = populated(contest.heroMedia)
  const image = hero && imageSize(hero, 'hero')
  const regulation = populated(contest.regulation)
  const prize = contest.prizes?.[0]
  const onRed = !image

  return (
    <section className="grid gap-4 md:gap-6 lg:grid-cols-12">
      {image && (
        <div className="relative aspect-[16/9] overflow-hidden rounded-card bg-secondary lg:col-span-7 lg:aspect-auto lg:min-h-96">
          <Image
            src={image.url}
            fill
            alt={hero?.alt ?? ''}
            priority
            sizes="(min-width: 1152px) 640px, (min-width: 1024px) 58vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div
        className={cn(
          'flex flex-col justify-center gap-5 rounded-card p-6 sm:p-8',
          onRed
            ? 'bg-primary text-primary-foreground [--ring:var(--primary-foreground)] lg:col-span-12 lg:p-12'
            : 'border bg-card shadow-card lg:col-span-5',
        )}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <ContestStatusBadge contest={contest} inverse={onRed} />
          <ContestCountdown contest={contest} className={onRed ? undefined : 'text-primary-ink'} />
        </div>
        {/* Sized down beside a picture, where the panel is narrow. */}
        <h1 className={onRed ? 'max-w-3xl text-h1' : 'text-h2'}>{contest.title}</h1>
        <div className={cn('flex flex-col gap-2', !onRed && 'text-muted-foreground')}>
          <div className="flex items-center gap-2 text-label">
            <CalendarDays aria-hidden className="size-5 shrink-0" />
            <ContestDates contest={contest} variant="range" />
          </div>
          {prize && (
            <p className="flex items-start gap-2 text-label">
              <Gift aria-hidden className="mt-0.5 size-5 shrink-0" />
              {t('card.toWin', {
                prize:
                  prize.quantity && prize.quantity > 1
                    ? `${prize.quantity} × ${prize.title}`
                    : prize.title,
              })}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {phase === 'open' && (
            <a
              href={`#${participationAnchor}`}
              {...{ [heroActionAttribute]: '' }}
              className={buttonVariants({ size: 'lg', variant: onRed ? 'inverse' : 'default' })}
            >
              {t('cta')}
            </a>
          )}
          {phase === 'scheduled' && (
            <Button size="lg" variant={onRed ? 'inverse' : 'secondary'} disabled>
              {t('opensButton', {
                date: format.dateTime(new Date(contest.startAt), { dateStyle: 'long' }),
              })}
            </Button>
          )}
          {(phase === 'closed' || phase === 'archived') && (
            <a
              href={`#${winnersAnchor}`}
              className={buttonVariants({ size: 'lg', variant: onRed ? 'inverse' : 'default' })}
            >
              {t('card.seeWinners')}
            </a>
          )}
          {regulation?.url && (
            <a
              href={regulation.url}
              target="_blank"
              rel="noopener"
              className={buttonVariants({
                size: 'lg',
                variant: onRed ? 'outline-inverse' : 'outline',
              })}
            >
              <FileText aria-hidden />
              {t('regulationShort')}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
