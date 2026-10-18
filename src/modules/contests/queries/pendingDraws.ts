import type { Payload } from 'payload'

import type { Locale } from '@/i18n/config'
import type { User } from '@/payload-types'

import { drawPeriodsOf, type DrawPeriod } from '../domain/drawPeriod'

/**
 * How the back-office queries read. Without `user` and `overrideAccess: false` they read with full
 * access, for callers that have already checked the user (the draw panel sits in the staff-only
 * draws list). The dashboard passes the signed-in user, so it shows only what they may open, and
 * the content language picked in the admin for contest titles.
 */
export interface ReadOptions {
  user?: User | null
  overrideAccess?: boolean
  locale?: Locale
}

export interface EndedPeriod {
  contest: { id: number; title: string }
  period: DrawPeriod
  /** Where its draw's pool starts: the period start, or the contest start (`poolScope`). */
  poolStart: Date
  /** Overlaps a recorded draw, so it cannot be drawn. */
  drawn: boolean
}

/** Every ended draw period of every non-draft contest, newest contest first. */
export async function endedDrawPeriods(
  payload: Payload,
  options: ReadOptions = {},
  now: Date = new Date(),
): Promise<EndedPeriod[]> {
  const { docs: contests } = await payload.find({
    collection: 'contests',
    where: { status: { not_equals: 'draft' } },
    sort: '-startAt',
    limit: 100,
    depth: 0,
    select: { title: true, startAt: true, endAt: true, draw: true },
    ...options,
  })
  const { docs: draws } = await payload.find({
    collection: 'draws',
    where: { contest: { in: contests.map(({ id }) => id) } },
    pagination: false,
    depth: 0,
    select: { contest: true, periodStart: true, periodEnd: true },
    ...options,
  })
  // A period overlapping any draw cannot be drawn, even if the period settings changed since.
  const overlapsDraw = (contestId: number, { start, end }: DrawPeriod) =>
    draws.some(
      (draw) =>
        (typeof draw.contest === 'object' ? draw.contest.id : draw.contest) === contestId &&
        new Date(draw.periodStart) < end &&
        new Date(draw.periodEnd) > start,
    )

  return contests.flatMap((contest) =>
    drawPeriodsOf(contest)
      .filter(({ end }) => end.getTime() <= now.getTime())
      .map((period) => ({
        contest: { id: contest.id, title: contest.title },
        period,
        poolStart:
          contest.draw.poolScope === 'sinceStart' ? new Date(contest.startAt) : period.start,
        drawn: overlapsDraw(contest.id, period),
      })),
  )
}

/** Ended periods nobody has drawn yet: the draws staff still have to run. */
export async function pendingDraws(
  payload: Payload,
  options: ReadOptions = {},
  now: Date = new Date(),
): Promise<EndedPeriod[]> {
  return (await endedDrawPeriods(payload, options, now)).filter(({ drawn }) => !drawn)
}

export interface UnpublishedWinner {
  id: number
  name: string
}

/**
 * Winners drawn but neither published nor voided, oldest first, in contests that are still
 * published. Once a contest is archived, a winner left unpublished (no consent to appear, for
 * example) is a decision, no longer something to do.
 */
export async function unpublishedWinners(
  payload: Payload,
  options: ReadOptions = {},
): Promise<UnpublishedWinner[]> {
  const { docs: contests } = await payload.find({
    collection: 'contests',
    where: { status: { equals: 'published' } },
    pagination: false,
    depth: 0,
    select: { status: true },
    ...options,
  })
  if (contests.length === 0) return []
  const { docs } = await payload.find({
    collection: 'winners',
    where: {
      published: { not_equals: true },
      voided: { not_equals: true },
      'draw.contest': { in: contests.map(({ id }) => id) },
    },
    sort: 'selectedAt',
    pagination: false,
    depth: 0,
    select: { publicDisplayName: true },
    ...options,
  })
  return docs.map(({ id, publicDisplayName }) => ({ id, name: publicDisplayName }))
}
