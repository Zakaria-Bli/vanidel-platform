import { Link } from '@/i18n/navigation'
import type { Contest } from '@/payload-types'

import { ContestDates } from './ContestDates'

export function ContestList({ contests }: { contests: Contest[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {contests.map((contest) => (
        <li key={contest.id} className="rounded-lg border p-4">
          <h2>
            <Link href={`/concours/${contest.slug}`}>{contest.title}</Link>
          </h2>
          <ContestDates contest={contest} />
        </li>
      ))}
    </ul>
  )
}
