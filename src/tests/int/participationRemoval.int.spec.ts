import { randomInt } from 'node:crypto'
import { createLocalReq, docAccessOperation, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { drawPeriodsOf } from '@/modules/contests/domain/drawPeriod'
import { executeDraw } from '@/modules/contests/services/draws'
import { submitParticipation } from '@/modules/contests/services/submitParticipation'
import { contestReport } from '@/modules/analytics/queries/contestReport'
import type { Contest, User } from '@/payload-types'

import { createPublishedContest, consentVersionsOf } from './helpers/contests'
import { phonePhoto } from './helpers/images'
import { createUser, getMigratedPayload } from './helpers/payload'

const day = 24 * 60 * 60 * 1000
const hour = 60 * 60 * 1000

let payload: Payload
let admin: User
let commercial: User
const contestIds: number[] = []
let photoSeed = randomInt(1_000_000)

const newPhone = () => `05${String(randomInt(100_000_000)).padStart(8, '0')}`

/** A published contest that started three weeks ago, so its first weekly period has ended. */
async function pastContest(): Promise<Contest> {
  const created = await createPublishedContest(payload)
  contestIds.push(created.id)
  return payload.update({
    collection: 'contests',
    id: created.id,
    data: {
      startAt: new Date(Date.now() - 21 * day).toISOString(),
      endAt: new Date(Date.now() + 7 * day).toISOString(),
      draw: { periodDays: 7, winnersPerDraw: 1, poolScope: 'period' },
    },
  })
}

/** Submits one participation, with its consent records, in the contest's first period. */
async function participate(contest: Contest): Promise<number> {
  const { participationId } = await submitParticipation(payload, {
    contestSlug: contest.slug,
    locale: 'fr',
    name: 'Amine Benali',
    phone: newPhone(),
    wilaya: '16',
    consents: { regulation: true, dataProcessing: true, marketing: true },
    consentVersions: consentVersionsOf(contest),
    ticket: await phonePhoto(photoSeed++),
    now: new Date(drawPeriodsOf(contest)[0].start.getTime() + hour),
  })
  return participationId
}

const asUser = (user: User) => ({ user, overrideAccess: false })

async function trash(id: number, user: User) {
  return payload.update({
    collection: 'participations',
    id,
    data: { deletedAt: new Date().toISOString() },
    ...asUser(user),
  })
}

async function restore(id: number, user: User) {
  return payload.update({
    collection: 'participations',
    id,
    data: { deletedAt: null },
    trash: true,
    ...asUser(user),
  })
}

const findTrashed = (id: number) =>
  payload.findByID({ collection: 'participations', id, trash: true, depth: 0 })

const isListed = async (id: number) =>
  (await payload.count({ collection: 'participations', where: { id: { equals: id } } }))
    .totalDocs === 1

beforeAll(async () => {
  payload = await getMigratedPayload()
  admin = await createUser(payload, 'admin')
  commercial = await createUser(payload, 'commercial')
}, 30_000)

afterAll(async () => {
  if (!payload) return
  const byContest = { contest: { in: contestIds } }
  await payload.delete({ collection: 'winners', where: { 'draw.contest': { in: contestIds } } })
  await payload.delete({ collection: 'draws', where: byContest })
  await payload.delete({
    collection: 'consent-records',
    where: {
      or: [
        { 'participation.contest': { in: contestIds } },
        { 'contact.firstContest': { in: contestIds } },
      ],
    },
  })
  await payload.delete({ collection: 'participations', where: byContest, trash: true })
  await payload.delete({ collection: 'contacts', where: { firstContest: { in: contestIds } } })
  await payload.delete({ collection: 'tickets', where: byContest })
  await payload.delete({ collection: 'contests', where: { id: { in: contestIds } } })
  await payload.delete({ collection: 'users', where: { id: { in: [admin.id, commercial.id] } } })
  await payload.destroy()
})

describe('permanent delete', () => {
  it('lets an admin delete a participation and keeps its consent records', async () => {
    const contest = await pastContest()
    const id = await participate(contest)

    await payload.delete({ collection: 'participations', id, ...asUser(admin) })

    await expect(findTrashed(id)).rejects.toThrow()
    const { docs: consents } = await payload.find({
      collection: 'consent-records',
      where: { 'contact.firstContest': { equals: contest.id } },
      depth: 0,
    })
    expect(consents).toHaveLength(3)
    expect(consents.every(({ participation }) => participation == null)).toBe(true)
  })

  it('lets an admin empty the trash', async () => {
    const contest = await pastContest()
    const id = await participate(contest)
    await trash(id, commercial)

    await payload.delete({ collection: 'participations', id, trash: true, ...asUser(admin) })

    await expect(findTrashed(id)).rejects.toThrow()
  })

  it('refuses a permanent delete by a commercial user', async () => {
    const contest = await pastContest()
    const id = await participate(contest)

    await expect(
      payload.delete({ collection: 'participations', id, ...asUser(commercial) }),
    ).rejects.toThrow()
    await trash(id, commercial)
    await expect(
      payload.delete({ collection: 'participations', id, trash: true, ...asUser(commercial) }),
    ).rejects.toThrow()
    expect((await findTrashed(id)).id).toBe(id)
  })
})

describe('trash', () => {
  it('lets a commercial user move a participation to the trash, out of lists and reports', async () => {
    const contest = await pastContest()
    const kept = await participate(contest)
    const id = await participate(contest)

    await trash(id, commercial)

    const trashed = await findTrashed(id)
    expect(trashed.deletedAt).toBeTruthy()
    expect(trashed.deletedBy).toBe(commercial.id)
    expect(await isListed(id)).toBe(false)
    expect(await isListed(kept)).toBe(true)
    const report = await contestReport(payload, contest.id)
    expect(report?.totals.participations).toBe(1)
  })

  it('leaves trashed participations out of draws', async () => {
    const contest = await pastContest()
    const kept = await participate(contest)
    await trash(await participate(contest), commercial)
    await trash(await participate(contest), admin)

    const { winnerIds } = await executeDraw(payload, {
      contestId: contest.id,
      periodStart: drawPeriodsOf(contest)[0].start,
      user: admin,
    })

    const winner = await payload.findByID({ collection: 'winners', id: winnerIds[0], depth: 0 })
    expect(winner.participation).toBe(kept)
    const draw = await payload.find({
      collection: 'draws',
      where: { contest: { equals: contest.id } },
      depth: 0,
    })
    expect(draw.docs[0].eligibleCount).toBe(1)
  })

  it('lets only an admin restore a participation', async () => {
    const contest = await pastContest()
    const id = await participate(contest)
    await trash(id, commercial)

    await expect(restore(id, commercial)).rejects.toThrow()
    expect(await isListed(id)).toBe(false)

    await restore(id, admin)
    const restored = await findTrashed(id)
    expect(restored.deletedAt).toBeFalsy()
    expect(restored.deletedBy).toBeFalsy()
    expect(await isListed(id)).toBe(true)
  })

  it('moves several participations to the trash and back, as the list page does', async () => {
    const contest = await pastContest()
    const ids = [await participate(contest), await participate(contest)]
    const where = { id: { in: ids } }

    const trashed = await payload.update({
      collection: 'participations',
      where,
      data: { deletedAt: new Date().toISOString() },
      ...asUser(commercial),
    })
    expect(trashed.errors).toEqual([])
    expect(trashed.docs).toHaveLength(2)

    const restored = await payload.update({
      collection: 'participations',
      where,
      data: { deletedAt: null },
      trash: true,
      ...asUser(admin),
    })
    expect(restored.docs).toHaveLength(2)
    expect(await isListed(ids[0])).toBe(true)
  })

  it('lets no one edit a participation while moving it to the trash', async () => {
    const contest = await pastContest()
    const id = await participate(contest)

    await expect(
      payload.update({
        collection: 'participations',
        id,
        data: { name: 'Edited' },
        ...asUser(commercial),
      }),
    ).rejects.toThrow()
    await payload.update({
      collection: 'participations',
      id,
      data: { deletedAt: new Date().toISOString(), name: 'Edited' },
      ...asUser(admin),
    })
    expect((await findTrashed(id)).name).toBe('Amine Benali')
  })

  it('refuses to remove a participation a draw selected', async () => {
    const contest = await pastContest()
    const id = await participate(contest)
    await executeDraw(payload, {
      contestId: contest.id,
      periodStart: drawPeriodsOf(contest)[0].start,
      user: admin,
    })

    const drawn = expect.objectContaining({ name: 'ParticipationDrawnError', status: 409 })
    await expect(trash(id, commercial)).rejects.toEqual(drawn)
    await expect(
      payload.delete({ collection: 'participations', id, ...asUser(admin) }),
    ).rejects.toEqual(drawn)
    expect(await isListed(id)).toBe(true)
  })
})

describe('admin buttons', () => {
  /**
   * What the admin pages offer, computed as Payload's getDocumentPermissions does: Restore needs
   * `update`, the trash button `delete` with `deletedAt` set, the permanent delete `delete`
   * without it.
   */
  async function buttons(user: User, id: number) {
    const req = await createLocalReq({ user }, payload)
    const { deletedBy: _, ...doc } = await findTrashed(id)
    const check = async (data: Record<string, unknown>) =>
      docAccessOperation({ id, collection: payload.collections.participations, data, req })
    const { deletedAt: __, ...withoutDeletedAt } = doc
    const [page, toTrash, permanently] = await Promise.all([
      check({ ...doc, _status: 'draft' }),
      check({ ...doc, deletedAt: new Date().toISOString() }),
      check(withoutDeletedAt),
    ])
    return {
      saveOrRestore: Boolean(page.update),
      trash: Boolean(toTrash.delete),
      deleteForGood: Boolean(permanently.delete),
    }
  }

  it('offers a commercial user the trash only', async () => {
    const contest = await pastContest()
    const id = await participate(contest)

    expect(await buttons(commercial, id)).toEqual({
      saveOrRestore: false,
      trash: true,
      deleteForGood: false,
    })
    await trash(id, commercial)
    expect((await buttons(commercial, id)).saveOrRestore).toBe(false)
  })

  it('offers an admin restore on a trashed participation, and no save button', async () => {
    const contest = await pastContest()
    const id = await participate(contest)

    expect(await buttons(admin, id)).toEqual({
      saveOrRestore: false,
      trash: true,
      deleteForGood: true,
    })
    await trash(id, commercial)
    expect((await buttons(admin, id)).saveOrRestore).toBe(true)
  })
})
