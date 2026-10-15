import { winnersByPeriod, type PublicWinner } from '@/modules/contests/domain/publicWinners'
import { contestPhase } from '@/modules/contests/domain/phase'
import type { Contest } from '@/payload-types'

import { ContestCard, ContestCardSkeleton } from './ContestCard'

const gridClass = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'

/**
 * Contest cards. With `featureOpen`, the open contest ending soonest comes first as a wide card,
 * then the others, open ones before upcoming ones. The archive passes its published winners.
 */
export function ContestList({
  contests,
  winners = [],
  featureOpen = false,
}: {
  contests: Contest[]
  winners?: PublicWinner[]
  featureOpen?: boolean
}) {
  const namesOf = (contest: Contest) =>
    winnersByPeriod(winners.filter(({ contestId }) => contestId === contest.id))
      .reverse()
      .flatMap((period) => period.winners.map(({ name }) => name))

  const open = contests
    .filter((contest) => contestPhase(contest) === 'open')
    .sort((a, b) => Date.parse(a.endAt) - Date.parse(b.endAt))
  const featured = featureOpen ? open[0] : undefined
  const rest = featureOpen
    ? [...open.slice(1), ...contests.filter((contest) => contestPhase(contest) !== 'open')]
    : contests

  return (
    <div className="flex flex-col gap-6">
      {featured && <ContestCard contest={featured} featured />}
      {rest.length > 0 && (
        <ul className={gridClass}>
          {rest.map((contest) => (
            <li key={contest.id} className="flex">
              <ContestCard contest={contest} winners={namesOf(contest)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Three card placeholders, while a list loads. */
export function ContestListSkeleton() {
  return (
    <div className={gridClass}>
      {[0, 1, 2].map((index) => (
        <ContestCardSkeleton key={index} />
      ))}
    </div>
  )
}
