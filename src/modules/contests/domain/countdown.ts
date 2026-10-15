import { drawTimeZone } from './drawPeriod'
import { contestPhase, type ContestSchedule } from './phase'

const dayMs = 24 * 60 * 60 * 1000

const algiersDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: drawTimeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** The Algiers calendar day containing `instant`, as a day count since the epoch. */
function algiersDay(instant: number): number {
  const [year, month, day] = algiersDate.format(instant).split('-').map(Number)
  return Date.UTC(year, month - 1, day) / dayMs
}

export type ContestCountdown = { kind: 'ends' | 'starts'; days: number }

/**
 * How many Algiers calendar days a contest has left (`ends`), or until it opens (`starts`): 0 is
 * today, 1 tomorrow. Its last day is the one before `endAt`, which is exclusive. Null once it has
 * ended, or when it is not published. Pages revalidate every minute, so day-level text stays right.
 */
export function contestCountdown(
  contest: ContestSchedule,
  now: Date = new Date(),
): ContestCountdown | null {
  const today = algiersDay(now.getTime())
  switch (contestPhase(contest, now)) {
    case 'open':
      return { kind: 'ends', days: algiersDay(new Date(contest.endAt).getTime() - 1) - today }
    case 'scheduled':
      return { kind: 'starts', days: algiersDay(new Date(contest.startAt).getTime()) - today }
    default:
      return null
  }
}
