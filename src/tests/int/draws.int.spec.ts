import { randomInt } from 'node:crypto'
import { createLocalReq, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { drawPeriodsOf } from '@/modules/contests/domain/drawPeriod'
import { drawAlgorithmVersion, hashPool } from '@/modules/contests/domain/selection'
import { listPublicWinners } from '@/modules/contests/queries/publicWinners'
import { executeDraw, voidAndRedraw } from '@/modules/contests/services/draws'
import { submitParticipation } from '@/modules/contests/services/submitParticipation'
import type { Contest, User } from '@/payload-types'
import { redrawWinner, runDraw } from '@/payload/endpoints/draws'

import { createPublishedContest } from './helpers/contests'
import { phonePhoto } from './helpers/images'
import { createUser, getMigratedPayload } from './helpers/payload'

const day = 24 * 60 * 60 * 1000
const hour = 60 * 60 * 1000

let payload: Payload
let operator: User
const contestIds: number[] = []
let photoSeed = randomInt(1_000_000)

const newPhone = () => `05${String(randomInt(100_000_000)).padStart(8, '0')}`

/** A published contest that started three weeks ago, so its first two weekly periods have ended. */
async function pastContest(winnersPerDraw = 1): Promise<Contest> {
  const created = await createPublishedContest(payload)
  contestIds.push(created.id)
  return payload.update({
    collection: 'contests',
    id: created.id,
    data: {
      startAt: new Date(Date.now() - 21 * day).toISOString(),
      endAt: new Date(Date.now() + 7 * day).toISOString(),
      draw: { periodDays: 7, winnersPerDraw },
    },
  })
}

/** Submits one participation at `at`; returns its ID. */
async function participate(contest: Contest, at: Date, name = 'Amine Benali'): Promise<number> {
  const { participationId } = await submitParticipation(payload, {
    contestSlug: contest.slug,
    locale: 'fr',
    name,
    phone: newPhone(),
    wilaya: '16',
    consents: { regulation: true, dataProcessing: true, marketing: false },
    consentVersions: { regulation: 'r1', dataProcessing: 'd1', marketing: 'm1' },
    ticket: await phonePhoto(photoSeed++),
    now: at,
  })
  return participationId
}

const periods = (contest: Contest) => drawPeriodsOf(contest)
const atStartOf = (contest: Contest, index: number, offset = hour) =>
  new Date(periods(contest)[index].start.getTime() + offset)

const refused = (code: string) => expect.objectContaining({ name: 'DrawError', code })

async function winnersOf(drawId: number) {
  const { docs } = await payload.find({
    collection: 'winners',
    where: { draw: { equals: drawId } },
    sort: 'rank',
    depth: 0,
  })
  return docs
}

beforeAll(async () => {
  payload = await getMigratedPayload()
  operator = await createUser(payload, 'commercial')
}, 30_000)

afterAll(async () => {
  if (!payload) return
  const byContest = { contest: { in: contestIds } }
  await payload.delete({ collection: 'winners', where: { 'draw.contest': { in: contestIds } } })
  // Re-draws first: they reference the draws they replace.
  await payload.delete({ collection: 'draws', where: { ...byContest, redrawOf: { exists: true } } })
  await payload.delete({ collection: 'draws', where: byContest })
  await payload.delete({
    collection: 'consent-records',
    where: { 'participation.contest': { in: contestIds } },
  })
  await payload.delete({ collection: 'participations', where: byContest })
  await payload.delete({ collection: 'contacts', where: { firstContest: { in: contestIds } } })
  await payload.delete({ collection: 'tickets', where: byContest })
  await payload.delete({ collection: 'contests', where: { id: { in: contestIds } } })
  await payload.delete({ collection: 'users', id: operator.id })
  await payload.destroy()
})

describe('executeDraw', () => {
  it('draws among the period’s participations only and records the audit trail', async () => {
    const contest = await pastContest(2)
    const pool = [
      await participate(contest, atStartOf(contest, 0), 'Amine Benali'),
      await participate(contest, atStartOf(contest, 0, 2 * hour), 'Samira Haddad'),
      await participate(contest, atStartOf(contest, 0, 3 * hour), 'Karim Ould'),
    ]
    // Submitted in the next period, so not eligible.
    const later = await participate(contest, atStartOf(contest, 1))
    const period = periods(contest)[0]

    const result = await executeDraw(payload, {
      contestId: contest.id,
      periodStart: period.start,
      user: operator,
      random: () => 0,
    })

    const draw = await payload.findByID({ collection: 'draws', id: result.drawId, depth: 0 })
    expect(draw).toMatchObject({
      contest: contest.id,
      periodStart: period.start.toISOString(),
      periodEnd: period.end.toISOString(),
      status: 'completed',
      eligibleCount: 3,
      poolHash: hashPool([...pool].sort((a, b) => a - b)),
      executedBy: operator.id,
      algorithmVersion: drawAlgorithmVersion,
    })
    expect(draw.redrawOf).toBeFalsy()

    const winners = await winnersOf(result.drawId)
    expect(winners.map(({ id }) => id)).toEqual(result.winnerIds)
    expect(winners).toHaveLength(2)
    // With a generator always returning 0, the picks are the pool in ascending ID order.
    expect(winners.map(({ participation }) => participation)).toEqual(pool.slice(0, 2))
    expect(winners.map(({ rank }) => rank)).toEqual([1, 2])
    expect(winners[0]).toMatchObject({
      publicDisplayName: 'Amine B.',
      published: false,
      voided: false,
    })
    expect(winners.map(({ participation }) => participation)).not.toContain(later)
  })

  it('draws a period once only, even when two operators click at the same time', async () => {
    const contest = await pastContest()
    await participate(contest, atStartOf(contest, 0))
    const run = () =>
      executeDraw(payload, {
        contestId: contest.id,
        periodStart: periods(contest)[0].start,
        user: operator,
      })

    const results = await Promise.allSettled([run(), run()])

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(results.find(({ status }) => status === 'rejected')).toMatchObject({
      reason: refused('already-drawn'),
    })
    await expect(run()).rejects.toEqual(refused('already-drawn'))
  })

  it('refuses a period that has not ended, an unknown period and an empty pool', async () => {
    const contest = await pastContest()
    const draw = (periodStart: Date) =>
      executeDraw(payload, { contestId: contest.id, periodStart, user: operator })

    await expect(draw(periods(contest)[3].start)).rejects.toEqual(refused('period-not-ended'))
    await expect(draw(atStartOf(contest, 0))).rejects.toEqual(refused('period-not-found'))
    await expect(draw(periods(contest)[1].start)).rejects.toEqual(refused('empty-pool'))
    await expect(
      executeDraw(payload, { contestId: -1, periodStart: new Date(), user: operator }),
    ).rejects.toEqual(refused('contest-not-found'))

    const { totalDocs } = await payload.count({
      collection: 'draws',
      where: { contest: { equals: contest.id } },
    })
    expect(totalDocs).toBe(0)
  })
})

describe('a draw and the period settings', () => {
  it('never draws time already covered by a draw, even after the period length changes', async () => {
    const contest = await pastContest()
    await participate(contest, atStartOf(contest, 0))
    const weekly = periods(contest)
    await executeDraw(payload, {
      contestId: contest.id,
      periodStart: weekly[0].start,
      user: operator,
    })

    const daily = await payload.update({
      collection: 'contests',
      id: contest.id,
      data: { draw: { periodDays: 1, winnersPerDraw: 1 } },
    })
    const days = periods(daily)
    const inDrawnWeek = days.filter(({ end }) => end <= weekly[0].end)
    const afterIt = days.find(({ start }) => start >= weekly[0].end)!
    await participate(daily, new Date(afterIt.start.getTime() + hour))

    for (const day of [inDrawnWeek[0], inDrawnWeek.at(-1)!]) {
      await expect(
        executeDraw(payload, { contestId: contest.id, periodStart: day.start, user: operator }),
      ).rejects.toEqual(refused('already-drawn'))
    }
    await expect(
      executeDraw(payload, { contestId: contest.id, periodStart: afterIt.start, user: operator }),
    ).resolves.toMatchObject({ winnerIds: [expect.any(Number)] })
  })
})

describe('a draw and submissions being saved', () => {
  it('refuses a submission for a period drawn while it was being saved', async () => {
    const contest = await pastContest()
    await participate(contest, atStartOf(contest, 0))
    await executeDraw(payload, {
      contestId: contest.id,
      periodStart: periods(contest)[0].start,
      user: operator,
    })

    await expect(participate(contest, atStartOf(contest, 0, 5 * hour))).rejects.toEqual(
      expect.objectContaining({ name: 'ParticipationError', code: 'period-drawn' }),
    )
  })

  it('either includes a concurrent submission in the pool or refuses it', async () => {
    const contest = await pastContest()
    await participate(contest, atStartOf(contest, 0))
    const period = periods(contest)[0]

    const [submitted, drawn] = await Promise.allSettled([
      participate(contest, atStartOf(contest, 0, 2 * hour)),
      executeDraw(payload, { contestId: contest.id, periodStart: period.start, user: operator }),
    ])
    expect(drawn.status).toBe('fulfilled')
    const draw = await payload.findByID({
      collection: 'draws',
      id: (drawn as PromiseFulfilledResult<{ drawId: number }>).value.drawId,
      depth: 0,
    })
    const { docs: pool } = await payload.find({
      collection: 'participations',
      where: {
        contest: { equals: contest.id },
        submittedAt: {
          greater_than_equal: period.start.toISOString(),
          less_than: period.end.toISOString(),
        },
      },
      sort: 'id',
      pagination: false,
      depth: 0,
    })

    if (submitted.status === 'rejected') {
      expect(submitted.reason).toMatchObject({ code: 'period-drawn' })
    }
    expect(draw.eligibleCount).toBe(pool.length)
    expect(draw.poolHash).toBe(hashPool(pool.map(({ id }) => id)))
  })
})

describe('voidAndRedraw', () => {
  it('voids the winner and excludes every earlier winner of the chain', async () => {
    const contest = await pastContest()
    const pool = [
      await participate(contest, atStartOf(contest, 0)),
      await participate(contest, atStartOf(contest, 0, 2 * hour)),
      await participate(contest, atStartOf(contest, 0, 3 * hour)),
    ]
    const original = await executeDraw(payload, {
      contestId: contest.id,
      periodStart: periods(contest)[0].start,
      user: operator,
    })

    const first = await voidAndRedraw(payload, {
      winnerId: original.winnerIds[0],
      reason: '  Ticket illisible ',
      user: operator,
    })
    const second = await voidAndRedraw(payload, {
      winnerId: first.winnerIds[0],
      reason: 'Injoignable',
      user: operator,
    })

    const voided = await payload.findByID({
      collection: 'winners',
      id: original.winnerIds[0],
      depth: 0,
    })
    expect(voided).toMatchObject({
      voided: true,
      voidReason: 'Ticket illisible',
      voidedBy: operator.id,
      published: false,
    })

    const firstRedraw = await payload.findByID({ collection: 'draws', id: first.drawId, depth: 0 })
    const secondRedraw = await payload.findByID({
      collection: 'draws',
      id: second.drawId,
      depth: 0,
    })
    expect(firstRedraw).toMatchObject({ redrawOf: original.drawId, eligibleCount: 2 })
    expect(secondRedraw).toMatchObject({ redrawOf: first.drawId, eligibleCount: 1 })
    const originalDraw = await payload.findByID({
      collection: 'draws',
      id: original.drawId,
      depth: 0,
    })
    expect(secondRedraw.periodStart).toBe(originalDraw.periodStart)
    expect(secondRedraw.periodEnd).toBe(originalDraw.periodEnd)

    // Three winners across the chain, all different, so the whole pool has been drawn.
    const picked = await Promise.all(
      [original, first, second].map(async ({ drawId }) => (await winnersOf(drawId))[0]),
    )
    expect(new Set(picked.map(({ participation }) => participation))).toEqual(new Set(pool))

    // Nobody is left: the winner stays valid and nothing new is recorded.
    await expect(
      voidAndRedraw(payload, { winnerId: second.winnerIds[0], reason: 'Refus', user: operator }),
    ).rejects.toEqual(refused('empty-pool'))
    const last = await payload.findByID({
      collection: 'winners',
      id: second.winnerIds[0],
      depth: 0,
    })
    expect(last.voided).toBe(false)
  })

  it('keeps a voided winner unpublished, whatever staff save', async () => {
    const contest = await pastContest()
    await participate(contest, atStartOf(contest, 0))
    await participate(contest, atStartOf(contest, 0, 2 * hour))
    const {
      winnerIds: [winnerId],
    } = await executeDraw(payload, {
      contestId: contest.id,
      periodStart: periods(contest)[0].start,
      user: operator,
    })
    await payload.update({ collection: 'winners', id: winnerId, data: { published: true } })
    await voidAndRedraw(payload, { winnerId, reason: 'Ticket illisible', user: operator })

    // As a stale admin form would send it.
    await expect(
      payload.update({
        collection: 'winners',
        id: winnerId,
        data: { published: true, voided: false },
        user: operator,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ path: 'published' })] },
    })

    const edited = await payload.update({
      collection: 'winners',
      id: winnerId,
      data: { publicDisplayName: 'Amine' },
      user: operator,
      overrideAccess: false,
    })
    expect(edited).toMatchObject({ publicDisplayName: 'Amine', published: false, voided: true })
  })

  it('refuses a missing reason, a voided winner and an unknown winner', async () => {
    const contest = await pastContest()
    await participate(contest, atStartOf(contest, 0))
    await participate(contest, atStartOf(contest, 0, 2 * hour))
    const { winnerIds } = await executeDraw(payload, {
      contestId: contest.id,
      periodStart: periods(contest)[0].start,
      user: operator,
    })
    const [winnerId] = winnerIds

    await expect(voidAndRedraw(payload, { winnerId, reason: ' ', user: operator })).rejects.toEqual(
      refused('reason-required'),
    )
    await voidAndRedraw(payload, { winnerId, reason: 'Ticket illisible', user: operator })
    await expect(
      voidAndRedraw(payload, { winnerId, reason: 'Encore', user: operator }),
    ).rejects.toEqual(refused('winner-voided'))
    await expect(
      voidAndRedraw(payload, { winnerId: -1, reason: 'Encore', user: operator }),
    ).rejects.toEqual(refused('winner-not-found'))
  })
})

describe('the admin endpoints', () => {
  async function call(
    endpoint: typeof runDraw,
    data: unknown,
    user: User | null,
    routeParams?: Record<string, string>,
  ): Promise<Response> {
    const req = await createLocalReq({ user: user ?? undefined }, payload)
    if (!user) req.user = null
    req.json = async () => data
    req.routeParams = routeParams
    return endpoint.handler(req)
  }

  it('lets staff run a draw and a re-draw, and reports refusals with their code', async () => {
    const contest = await pastContest()
    await participate(contest, atStartOf(contest, 0))
    await participate(contest, atStartOf(contest, 0, 2 * hour))
    const periodStart = periods(contest)[0].start.toISOString()

    const anonymous = await call(runDraw, { contestId: contest.id, periodStart }, null)
    expect(anonymous.status).toBe(403)
    expect((await call(runDraw, { contestId: 'x', periodStart }, operator)).status).toBe(400)

    const drawn = await call(runDraw, { contestId: contest.id, periodStart }, operator)
    expect(drawn.status).toBe(201)
    const { winnerIds } = await drawn.json()

    const again = await call(runDraw, { contestId: contest.id, periodStart }, operator)
    expect(again.status).toBe(409)
    expect(await again.json()).toMatchObject({ code: 'already-drawn' })

    const id = String(winnerIds[0])
    expect((await call(redrawWinner, { reason: 'Injoignable' }, null, { id })).status).toBe(403)
    const redrawn = await call(redrawWinner, { reason: 'Injoignable' }, operator, { id })
    expect(redrawn.status).toBe(201)
    expect(await redrawn.json()).toMatchObject({ winnerIds: [expect.any(Number)] })
  })
})

describe('listPublicWinners', () => {
  const publish = (id: number) =>
    payload.update({ collection: 'winners', id, data: { published: true }, depth: 0 })

  it('shows only published, non-voided winners of the given contests, without their entry', async () => {
    const contest = await pastContest(2)
    const other = await pastContest()
    for (const offset of [hour, 2 * hour, 3 * hour]) {
      await participate(contest, atStartOf(contest, 0, offset), 'Amine Benali')
    }
    await participate(other, atStartOf(other, 0))
    const period = periods(contest)[0]
    const draw = await executeDraw(payload, {
      contestId: contest.id,
      periodStart: period.start,
      user: operator,
    })
    const [first, second] = draw.winnerIds
    await publish(first)
    const otherDraw = await executeDraw(payload, {
      contestId: other.id,
      periodStart: periods(other)[0].start,
      user: operator,
    })
    await publish(otherDraw.winnerIds[0])

    const shown = await listPublicWinners(payload, [contest.id], 'fr')
    expect(shown).toEqual([
      {
        id: first,
        contestId: contest.id,
        name: 'Amine B.',
        rank: 1,
        periodStart: period.start.toISOString(),
        periodEnd: period.end.toISOString(),
        media: null,
      },
    ])
    expect(shown.map(({ id }) => id)).not.toContain(second)

    // Voiding unpublishes; the published replacement takes its place in the same period.
    const redraw = await voidAndRedraw(payload, {
      winnerId: first,
      reason: 'Ticket illisible',
      user: operator,
    })
    expect(await listPublicWinners(payload, [contest.id], 'fr')).toEqual([])
    await publish(redraw.winnerIds[0])
    const replaced = await listPublicWinners(payload, [contest.id, other.id], 'fr')
    expect(replaced.map(({ id }) => id).sort()).toEqual(
      [redraw.winnerIds[0], otherDraw.winnerIds[0]].sort(),
    )
    expect(replaced.find(({ contestId }) => contestId === contest.id)?.periodStart).toBe(
      period.start.toISOString(),
    )
  })

  it('returns nothing without contests', async () => {
    expect(await listPublicWinners(payload, [], 'fr')).toEqual([])
  })
})
