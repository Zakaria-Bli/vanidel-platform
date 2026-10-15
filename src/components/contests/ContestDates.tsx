import { getFormatter, getTranslations } from 'next-intl/server'

import { contestPhase } from '@/modules/contests/domain/phase'
import type { Contest } from '@/payload-types'

/**
 * In Algiers time: "Opens on…", "Until…" or "Ended on…" by default, or the `range` from the first
 * to the last day ("15 oct. – 12 nov. 2026"; the end is exclusive, so the last day is the one
 * before it).
 */
export async function ContestDates({
  contest,
  variant = 'phase',
  className,
}: {
  contest: Contest
  variant?: 'phase' | 'range'
  className?: string
}) {
  const format = await getFormatter()

  if (variant === 'range') {
    return (
      <p className={className}>
        {format.dateTimeRange(new Date(contest.startAt), new Date(Date.parse(contest.endAt) - 1), {
          dateStyle: 'medium',
        })}
      </p>
    )
  }

  const t = await getTranslations('contests.phase')
  const date = (value: string) =>
    format.dateTime(new Date(value), { dateStyle: 'long', timeStyle: 'short' })

  switch (contestPhase(contest)) {
    case 'scheduled':
      return <p className={className}>{t('scheduled', { date: date(contest.startAt) })}</p>
    case 'open':
      return <p className={className}>{t('open', { date: date(contest.endAt) })}</p>
    default:
      return <p className={className}>{t('closed', { date: date(contest.endAt) })}</p>
  }
}
