import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
  type PayloadRequest,
} from 'payload'

import type { Contest, Draw, User } from '@/payload-types'

import { drawPeriodFor, type DrawPeriod } from '../domain/drawPeriod'
import { maskName } from '../domain/maskName'
import {
  drawAlgorithmVersion,
  hashPool,
  orderPool,
  selectFromPool,
  type RandomIndex,
} from '../domain/selection'
import { advisoryLock, contestDrawLock } from './advisoryLock'

/** Why a draw or re-draw was refused; the admin panel translates each code. */
export const drawErrorCodes = [
  'contest-not-found',
  'period-not-found',
  'period-not-ended',
  'already-drawn',
  'empty-pool',
  'winner-not-found',
  'winner-voided',
  'reason-required',
] as const

export type DrawErrorCode = (typeof drawErrorCodes)[number]

export class DrawError extends Error {
  constructor(readonly code: DrawErrorCode) {
    super(`Draw refused: ${code}`)
    this.name = 'DrawError'
  }
}

export interface DrawResult {
  drawId: number
  /** In rank order. */
  winnerIds: number[]
}

interface Options {
  /** Execution time; defaults to now. */
  now?: Date
  /** Defaults to `crypto.randomInt`; tests pass a fixed sequence. */
  random?: RandomIndex
}

export interface ExecuteDrawInput extends Options {
  contestId: number
  /** Start of the period to draw, as listed by `drawPeriodsOf`. */
  periodStart: Date
  user: User
}

export interface RedrawInput extends Options {
  winnerId: number
  reason: string
  user: User
}

const idOf = (value: number | { id: number }) => (typeof value === 'object' ? value.id : value)

/** Runs `work` in one transaction, rolled back if it throws. */
async function inTransaction<T>(
  payload: Payload,
  work: (req: PayloadRequest) => Promise<T>,
): Promise<T> {
  const req = await createLocalReq({}, payload)
  await initTransaction(req)
  try {
    const result = await work(req)
    await commitTransaction(req)
    return result
  } catch (error) {
    await killTransaction(req)
    throw error
  }
}

/**
 * Draws `count` winners among the contest's participations submitted during the period, minus
 * `excluded`, and records the draw with its pool hash and one Winner per pick.
 */
async function drawFromPool(
  payload: Payload,
  req: PayloadRequest,
  args: {
    contest: Contest
    period: Pick<DrawPeriod, 'start' | 'end'>
    excluded: Set<number>
    count: number
    redrawOf?: Draw
    user: User
    now: Date
    random?: RandomIndex
  },
): Promise<DrawResult> {
  const { docs } = await payload.find({
    collection: 'participations',
    where: {
      contest: { equals: args.contest.id },
      submittedAt: {
        greater_than_equal: args.period.start.toISOString(),
        less_than: args.period.end.toISOString(),
      },
    },
    select: { name: true },
    pagination: false,
    depth: 0,
    req,
  })
  const names = new Map(docs.map(({ id, name }) => [id, name]))
  const pool = orderPool(docs.map(({ id }) => id).filter((id) => !args.excluded.has(id)))
  if (pool.length === 0) throw new DrawError('empty-pool')

  const picks = selectFromPool(pool, args.count, args.random)
  const executedAt = args.now.toISOString()

  const draw = await payload.create({
    collection: 'draws',
    data: {
      contest: args.contest.id,
      periodStart: args.period.start.toISOString(),
      periodEnd: args.period.end.toISOString(),
      status: 'completed',
      eligibleCount: pool.length,
      poolHash: hashPool(pool),
      executedAt,
      executedBy: args.user.id,
      algorithmVersion: drawAlgorithmVersion,
      randomnessMetadata: {
        source: 'node:crypto.randomInt',
        poolOrder: 'participation id ascending',
        hashInput: 'ids joined by \\n',
        requested: args.count,
        selected: picks.length,
        excludedEarlierWinners: [...args.excluded].sort((a, b) => a - b),
      },
      redrawOf: args.redrawOf?.id,
    },
    depth: 0,
    req,
  })

  const winnerIds: number[] = []
  for (const [index, participationId] of picks.entries()) {
    const winner = await payload.create({
      collection: 'winners',
      data: {
        draw: draw.id,
        participation: participationId,
        rank: index + 1,
        selectedAt: executedAt,
        publicDisplayName: maskName(names.get(participationId) ?? ''),
        published: false,
      },
      depth: 0,
      req,
    })
    winnerIds.push(winner.id)
  }

  return { drawId: draw.id, winnerIds }
}

/**
 * Runs the draw of one ended contest period (SPECIFICATION §10.2): every participation submitted
 * in the period is eligible, and the contest's `winnersPerDraw` are picked with
 * `crypto.randomInt`. Time already covered by a draw is never drawn again, even if the period
 * settings changed since; replacing a winner goes through `voidAndRedraw`.
 * Throws `DrawError` for anything the operator can act on.
 */
export async function executeDraw(payload: Payload, input: ExecuteDrawInput): Promise<DrawResult> {
  const now = input.now ?? new Date()

  const contest = await payload
    .findByID({ collection: 'contests', id: input.contestId, depth: 0 })
    .catch(() => null)
  if (!contest) throw new DrawError('contest-not-found')

  const period = drawPeriodFor(contest, input.periodStart)
  if (!period || period.start.getTime() !== input.periodStart.getTime()) {
    throw new DrawError('period-not-found')
  }
  if (period.end > now) throw new DrawError('period-not-ended')

  return inTransaction(payload, async (req) => {
    await advisoryLock(payload, req, contestDrawLock(contest.id))

    // Any overlap, not only the same start: the period settings may have changed since a draw.
    const { totalDocs: drawn } = await payload.count({
      collection: 'draws',
      where: {
        contest: { equals: contest.id },
        periodStart: { less_than: period.end.toISOString() },
        periodEnd: { greater_than: period.start.toISOString() },
      },
      req,
    })
    if (drawn > 0) throw new DrawError('already-drawn')

    return drawFromPool(payload, req, {
      contest,
      period,
      excluded: new Set(),
      count: contest.draw.winnersPerDraw,
      user: input.user,
      now,
      random: input.random,
    })
  })
}

/**
 * Voids a drawn winner with a reason and draws one replacement (SPECIFICATION §10.3). The re-draw
 * is a new draw linked to the winner's draw, over the same period, excluding every participation
 * already selected anywhere in that period's draw chain, voided or not. Earlier records are never
 * changed, apart from the winner being voided and unpublished.
 */
export async function voidAndRedraw(payload: Payload, input: RedrawInput): Promise<DrawResult> {
  const now = input.now ?? new Date()
  const reason = input.reason.trim()
  if (!reason) throw new DrawError('reason-required')

  const found = await payload
    .findByID({ collection: 'winners', id: input.winnerId, depth: 1 })
    .catch(() => null)
  if (!found || typeof found.draw !== 'object') throw new DrawError('winner-not-found')
  const { periodStart, periodEnd } = found.draw
  const contestId = idOf(found.draw.contest)

  return inTransaction(payload, async (req) => {
    await advisoryLock(payload, req, contestDrawLock(contestId))

    // Re-read under the lock: a concurrent re-draw may have voided this winner already.
    const winner = await payload.findByID({
      collection: 'winners',
      id: input.winnerId,
      depth: 0,
      req,
    })
    if (winner.voided) throw new DrawError('winner-voided')

    const contest = await payload.findByID({ collection: 'contests', id: contestId, depth: 0, req })
    const draw = await payload.findByID({
      collection: 'draws',
      id: idOf(winner.draw),
      depth: 0,
      req,
    })

    // Draws never overlap except within a chain, which keeps its original period, so the draws of
    // exactly this period are the chain.
    const { docs: chain } = await payload.find({
      collection: 'draws',
      where: {
        contest: { equals: contestId },
        periodStart: { equals: periodStart },
        periodEnd: { equals: periodEnd },
      },
      select: {},
      pagination: false,
      depth: 0,
      req,
    })
    const { docs: earlierWinners } = await payload.find({
      collection: 'winners',
      where: { draw: { in: chain.map(({ id }) => id) } },
      select: { participation: true },
      pagination: false,
      depth: 0,
      req,
    })

    await payload.update({
      collection: 'winners',
      id: winner.id,
      data: {
        voided: true,
        voidReason: reason,
        voidedBy: input.user.id,
        voidedAt: now.toISOString(),
        published: false,
      },
      depth: 0,
      req,
    })

    return drawFromPool(payload, req, {
      contest,
      period: { start: new Date(periodStart), end: new Date(periodEnd) },
      excluded: new Set(earlierWinners.map(({ participation }) => idOf(participation))),
      count: 1,
      redrawOf: draw,
      user: input.user,
      now,
      random: input.random,
    })
  })
}
