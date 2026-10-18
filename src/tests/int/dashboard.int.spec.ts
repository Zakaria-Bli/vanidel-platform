import { randomInt } from 'node:crypto'
import { Forbidden, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { participationCounts } from '@/modules/analytics/queries/participationCounts'
import {
  drawPeriodsOf,
  drawTimeZone,
  startOfAlgiersDay,
} from '@/modules/contests/domain/drawPeriod'
import { incompleteDrafts } from '@/modules/contests/queries/incompleteDrafts'
import {
  endedDrawPeriods,
  pendingDraws,
  unpublishedWinners,
} from '@/modules/contests/queries/pendingDraws'
import { executeDraw } from '@/modules/contests/services/draws'
import { submitParticipation } from '@/modules/contests/services/submitParticipation'
import type { Contest, User } from '@/payload-types'

import {
  createDraftContest,
  createPublishedContest,
  translateToArabic,
  consentVersionsOf,
} from './helpers/contests'
import { phonePhoto } from './helpers/images'
import { createUser, getMigratedPayload } from './helpers/payload'

const day = 24 * 60 * 60 * 1000
const hour = 60 * 60 * 1000

let payload: Payload
let commercial: User
const contestIds: number[] = []
let photoSeed = randomInt(1_000_000)

const newPhone = () => `05${String(randomInt(100_000_000)).padStart(8, '0')}`

/** As the dashboard reads: as the signed-in user, or as a visitor when `user` is null. */
const as = (user: User | null) => ({ user, overrideAccess: false })

/** A published contest that started three weeks ago, entries up to three per phone and period. */
async function pastContest(winnersPerDraw = 1): Promise<Contest> {
  const created = await createPublishedContest(payload)
  contestIds.push(created.id)
  return payload.update({
    collection: 'contests',
    id: created.id,
    data: {
      startAt: new Date(Date.now() - 21 * day).toISOString(),
      endAt: new Date(Date.now() + 7 * day).toISOString(),
      entryLimitPerPhone: 3,
      draw: { periodDays: 7, winnersPerDraw },
    },
  })
}

async function participate(contest: Contest, at: Date, phone = newPhone(), name = 'Amine Benali') {
  await submitParticipation(payload, {
    contestSlug: contest.slug,
    locale: 'fr',
    name,
    phone,
    wilaya: '16',
    consents: { regulation: true, dataProcessing: true, marketing: false },
    consentVersions: consentVersionsOf(contest),
    ticket: await phonePhoto(photoSeed++),
    now: at,
  })
}

/** Draws the contest's first period, with three entries in it. */
async function drawFirstPeriod(contest: Contest): Promise<number[]> {
  const [first] = drawPeriodsOf(contest)
  for (const [index, name] of ['Amine Benali', 'Samira Haddad', 'Karim Ould'].entries()) {
    await participate(
      contest,
      new Date(first.start.getTime() + (index + 1) * hour),
      newPhone(),
      name,
    )
  }
  const { winnerIds } = await executeDraw(payload, {
    contestId: contest.id,
    periodStart: first.start,
    user: commercial,
    random: () => 0,
  })
  return winnerIds
}

beforeAll(async () => {
  payload = await getMigratedPayload()
  commercial = await createUser(payload, 'commercial')
}, 30_000)

afterAll(async () => {
  if (!payload) return
  const byContest = { contest: { in: contestIds } }
  await payload.delete({ collection: 'winners', where: { 'draw.contest': { in: contestIds } } })
  await payload.delete({ collection: 'draws', where: byContest })
  await payload.delete({
    collection: 'consent-records',
    where: { 'participation.contest': { in: contestIds } },
  })
  await payload.delete({ collection: 'participations', where: byContest })
  await payload.delete({ collection: 'contacts', where: { firstContest: { in: contestIds } } })
  await payload.delete({ collection: 'tickets', where: byContest })
  await payload.delete({ collection: 'contests', where: { id: { in: contestIds } } })
  await payload.delete({ collection: 'users', id: commercial.id })
  await payload.destroy()
})

describe('pendingDraws', () => {
  it('lists the ended periods nobody has drawn, for the commercial team too', async () => {
    const contest = await pastContest()
    await drawFirstPeriod(contest)
    const periods = drawPeriodsOf(contest)
    // When the second period has just ended: two ended periods, the first one drawn.
    const now = periods[1].end

    const ended = (await endedDrawPeriods(payload, {}, now)).filter(
      ({ contest: { id } }) => id === contest.id,
    )
    expect(ended.map(({ period, drawn }) => [period.index, drawn])).toEqual([
      [0, true],
      [1, false],
    ])

    const pending = (await pendingDraws(payload, as(commercial), now)).filter(
      ({ contest: { id } }) => id === contest.id,
    )
    expect(pending).toEqual([
      { contest: { id: contest.id, title: contest.title }, period: periods[1], drawn: false },
    ])
  })

  it('leaves out drafts and refuses visitors', async () => {
    const draft = await createDraftContest(payload)
    contestIds.push(draft.id)
    await payload.update({
      collection: 'contests',
      id: draft.id,
      data: { startAt: new Date(Date.now() - 21 * day).toISOString() },
    })

    const pending = await pendingDraws(payload, as(commercial))
    expect(pending.some(({ contest }) => contest.id === draft.id)).toBe(false)
    await expect(pendingDraws(payload, as(null))).rejects.toBeInstanceOf(Forbidden)
  })
})

describe('unpublishedWinners', () => {
  it('lists drawn winners until they are published, in published contests only', async () => {
    const contest = await pastContest(2)
    const [first, second] = await drawFirstPeriod(contest)
    const archived = await pastContest()
    const [left] = await drawFirstPeriod(archived)
    // Winners are published as drawn; these are held back.
    for (const id of [first, second, left]) {
      await payload.update({ collection: 'winners', id, data: { published: false } })
    }

    const ids = async () => (await unpublishedWinners(payload, as(commercial))).map(({ id }) => id)
    expect(await ids()).toEqual(expect.arrayContaining([first, second, left]))
    expect(await unpublishedWinners(payload, as(commercial))).toEqual(
      expect.arrayContaining([{ id: first, name: 'Amine B.' }]),
    )

    await payload.update({ collection: 'winners', id: first, data: { published: true } })
    await payload.update({ collection: 'contests', id: archived.id, data: { status: 'archived' } })
    const after = await ids()
    expect(after).toContain(second)
    expect(after).not.toContain(first)
    expect(after).not.toContain(left)

    await expect(unpublishedWinners(payload, as(null))).rejects.toBeInstanceOf(Forbidden)
  })
})

describe('participationCounts', () => {
  it('counts entries in total, since midnight in Algiers, and per phone', async () => {
    const contest = await pastContest()
    const now = new Date()
    const today = new Intl.DateTimeFormat('sv-SE', {
      timeZone: drawTimeZone,
      dateStyle: 'short',
    }).format(now)
    const midnight = startOfAlgiersDay(today)!.getTime()
    const repeat = newPhone()
    await participate(contest, new Date(midnight - hour))
    await participate(contest, new Date(midnight + 1000), repeat)
    await participate(contest, new Date(midnight + 2000), repeat)
    const quiet = await pastContest()

    const counts = await participationCounts(payload, [contest.id, quiet.id], as(commercial), now)
    expect(counts?.get(contest.id)).toEqual({ total: 3, today: 2, uniquePhones: 2 })
    // A contest without entries is left out.
    expect(counts?.has(quiet.id)).toBe(false)

    expect(await participationCounts(payload, [], as(commercial))).toEqual(new Map())
    expect(await participationCounts(payload, [contest.id], as(null))).toBeNull()
  })
})

describe('incompleteDrafts', () => {
  it('lists drafts that cannot be published yet, with what they miss', async () => {
    const frenchOnly = await createDraftContest(payload)
    const translated = await createDraftContest(payload)
    contestIds.push(frenchOnly.id, translated.id)
    await translateToArabic(payload, translated.id)

    const drafts = await incompleteDrafts(payload, { ...as(commercial), locale: 'ar' })
    const mine = drafts.filter(({ id }) => id === frenchOnly.id || id === translated.id)
    // The Arabic title is missing, so the French one stands in.
    expect(mine).toEqual([
      { id: frenchOnly.id, title: 'Grand concours', missing: ['translations'] },
    ])

    // Visitors never see drafts.
    expect(await incompleteDrafts(payload, as(null))).toEqual([])
  })
})
