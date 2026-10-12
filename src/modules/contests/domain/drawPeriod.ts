import type { ContestSchedule } from './phase'

/** Draw periods and their boundaries follow the Algerian calendar (SPECIFICATION §10.1). */
export const drawTimeZone = 'Africa/Algiers'

const dayMs = 24 * 60 * 60 * 1000

const wallClock = new Intl.DateTimeFormat('en-US', {
  timeZone: drawTimeZone,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

/**
 * Milliseconds that Algiers is ahead of UTC at `instant`. Computed rather than hard-coded so the
 * server's own time zone (UTC in containers) never matters. Algeria has no DST, so the offset at a
 * period boundary equals the offset at any instant in it.
 */
function algiersOffset(instant: number): number {
  const parts = Object.fromEntries(
    wallClock.formatToParts(instant).map(({ type, value }) => [type, Number(value)]),
  )
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  return asUtc - Math.floor(instant / 1000) * 1000
}

/** In `Date#getUTCDay()` order, so a weekday's index is its day number. */
export const weekdays = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

export type Weekday = (typeof weekdays)[number]

export interface DrawSettings {
  /** Period length in days; 7 for weekly draws. */
  periodDays: number
  /** Weekday periods start on in Algiers; defaults to the contest start's weekday. */
  periodStartDay?: Weekday | null
}

export interface DrawPeriod {
  /** Zero-based period number within the contest. */
  index: number
  start: Date
  /** Exclusive. */
  end: Date
}

/**
 * The draw period containing `instant`, or null outside the contest. Periods start at 00:00 Algiers
 * time on `periodStartDay`, last `periodDays`, and the first and last are clipped to the contest's
 * start and end.
 */
export function drawPeriodFor(
  contest: Pick<ContestSchedule, 'startAt' | 'endAt'> & { draw: DrawSettings },
  instant: Date,
): DrawPeriod | null {
  const startAt = new Date(contest.startAt).getTime()
  const endAt = new Date(contest.endAt).getTime()
  const time = instant.getTime()
  if (time < startAt || time >= endAt) return null

  const { periodDays, periodStartDay } = contest.draw
  if (!Number.isInteger(periodDays) || periodDays < 1) {
    throw new RangeError(`periodDays must be a positive integer, got ${periodDays}`)
  }

  // Work in Algiers wall-clock milliseconds, where every day is exactly 24 hours.
  const offset = algiersOffset(startAt)
  const localStart = startAt + offset
  const startMidnight = localStart - (((localStart % dayMs) + dayMs) % dayMs)
  const startWeekday = new Date(startMidnight).getUTCDay()
  const anchorDay = periodStartDay ? weekdays.indexOf(periodStartDay) : startWeekday
  const anchor = startMidnight - ((startWeekday - anchorDay + 7) % 7) * dayMs

  const length = periodDays * dayMs
  const slot = Math.floor((time + offset - anchor) / length)
  const firstSlot = Math.floor((localStart - anchor) / length)
  const periodStart = anchor + slot * length - offset

  return {
    index: slot - firstSlot,
    start: new Date(Math.max(periodStart, startAt)),
    end: new Date(Math.min(periodStart + length, endAt)),
  }
}

/**
 * 00:00 Algiers time on a calendar day given as `YYYY-MM-DD`, as a UTC instant; null when the
 * string is not a valid date. For date filters typed by staff.
 */
export function startOfAlgiersDay(day: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) return null
  const [year, month, date] = match.slice(1).map(Number)
  const utcMidnight = Date.UTC(year, month - 1, date)
  const check = new Date(utcMidnight)
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== date) return null
  return new Date(utcMidnight - algiersOffset(utcMidnight))
}
