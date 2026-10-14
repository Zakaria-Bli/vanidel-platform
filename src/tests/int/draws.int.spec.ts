import { randomInt } from 'node:crypto'
import { createLocalReq, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { drawPeriodsOf } from '@/modules/contests/domain/drawPeriod'
import { drawAlgorithmVersion, hashPool } from '@/modules/contests/domain/selection'
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
