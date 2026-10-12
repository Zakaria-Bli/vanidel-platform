export const contestStatuses = ['draft', 'published', 'archived'] as const

export type ContestStatus = (typeof contestStatuses)[number]

/**
 * Lifecycle phase from SPECIFICATION §4. Only `draft`, `published` and `archived` are stored;
 * whether a published contest is scheduled, open or closed follows from its dates, so the stored
 * status can never contradict them.
 */
export type ContestPhase = 'draft' | 'scheduled' | 'open' | 'closed' | 'archived'

export interface ContestSchedule {
  status: ContestStatus
  startAt: string | Date
  /** Exclusive: the contest stops accepting participations at this instant. */
  endAt: string | Date
}

export function contestPhase(contest: ContestSchedule, now: Date = new Date()): ContestPhase {
  if (contest.status !== 'published') return contest.status

  const time = now.getTime()
  if (time < new Date(contest.startAt).getTime()) return 'scheduled'
  if (time < new Date(contest.endAt).getTime()) return 'open'
  return 'closed'
}
