import { getFormatter, getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { winnersByPeriod, type PublicWinner } from '@/modules/contests/domain/publicWinners'
import type { Contest } from '@/payload-types'

import { ContestDates } from './ContestDates'

/** Contests linking to their pages; the archive also names each contest's published winners. */
export async function ContestList({
  contests,
  winners = [],
}: {
  contests: Contest[]
  winners?: PublicWinner[]
}) {
  const t = await getTranslations('contests')
  const format = await getFormatter()
  const namesOf = (contest: Contest) =>
    winnersByPeriod(winners.filter(({ contestId }) => contestId === contest.id))
      .reverse()
      .flatMap((period) => period.winners.map(({ name }) => name))

  return (
    <ul className="flex flex-col gap-4">
      {contests.map((contest) => {
        const names = namesOf(contest)
        return (
          <li key={contest.id} className="flex flex-col gap-1 rounded-lg border p-4">
            <h2>
              <Link href={`/concours/${contest.slug}`}>{contest.title}</Link>
            </h2>
            <ContestDates contest={contest} />
            {names.length > 0 && (
              <p className="text-muted-foreground">
                {t.rich('winnersOf', {
                  // Latin names in Arabic text keep their own direction.
                  names: () =>
                    format.list(
                      names.map((name, index) => <bdi key={index}>{name}</bdi>),
                      { type: 'conjunction' },
                    ),
                })}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
