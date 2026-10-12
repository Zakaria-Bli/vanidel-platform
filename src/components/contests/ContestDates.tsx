import { getFormatter, getTranslations } from 'next-intl/server'

import { contestPhase } from '@/modules/contests/domain/phase'
import type { Contest } from '@/payload-types'

/** "Opens on…", "Until…" or "Ended on…", in Algiers time. */
export async function ContestDates({ contest }: { contest: Contest }) {
  const t = await getTranslations('contests.phase')
  const format = await getFormatter()
  const date = (value: string) =>
    format.dateTime(new Date(value), { dateStyle: 'long', timeStyle: 'short' })

  switch (contestPhase(contest)) {
    case 'scheduled':
      return <p>{t('scheduled', { date: date(contest.startAt) })}</p>
    case 'open':
      return <p>{t('open', { date: date(contest.endAt) })}</p>
    default:
      return <p>{t('closed', { date: date(contest.endAt) })}</p>
  }
}
