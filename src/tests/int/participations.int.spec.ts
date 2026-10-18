import { randomUUID } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import type { CollectionSlug, Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  removeTicketFiles,
  sha256,
  storeTicket,
  TicketRejectedError,
} from '@/modules/contests/services/storeTicket'
import type { Contact, Contest, Participation, Ticket, User } from '@/payload-types'

import { createDraftContest } from './helpers/contests'
import { phonePhoto } from './helpers/images'
import { createUser, getMigratedPayload } from './helpers/payload'

let payload: Payload
let admin: User
let commercial: User
let contest: Contest
let ticket: Ticket
let contact: Contact
let participation: Participation

beforeAll(async () => {
  payload = await getMigratedPayload()
  admin = await createUser(payload, 'admin')
  commercial = await createUser(payload, 'commercial')
  contest = await createDraftContest(payload)
  ticket = await storeTicket(payload, { contestId: contest.id, data: await phonePhoto(1) })
  const phone = `+2135${String(Date.now()).slice(-8)}`
  contact = await payload.create({
    collection: 'contacts',
    data: { phoneNormalized: phone, name: 'Amine Benali', firstContest: contest.id },
  })
  participation = await payload.create({
    collection: 'participations',
    data: {
      contest: contest.id,
      contact: contact.id,
      submittedAt: new Date().toISOString(),
      periodStart: new Date().toISOString(),
      name: 'Amine Benali',
      phone: '0' + phone.slice(4),
      phoneNormalized: phone,
      ticket: ticket.id,
      locale: 'fr',
      utmSource: 'qr',
    },
  })
}, 30_000)

afterAll(async () => {
  if (!payload) return
  await payload.delete({
    collection: 'participations',
    where: { contest: { equals: contest?.id } },
  })
  await payload.delete({ collection: 'contacts', where: { firstContest: { equals: contest?.id } } })
  await payload.delete({ collection: 'tickets', where: { contest: { equals: contest?.id } } })
  if (contest) await payload.delete({ collection: 'contests', id: contest.id })
  await payload.delete({
    collection: 'users',
    where: { id: { in: [admin?.id, commercial?.id].filter(Boolean) } },
  })
  await payload.destroy()
})

/** Where a stored ticket's file is on disk (local storage in tests). */
function ticketPath(filename: string): string {
  const { staticDir } = payload.collections.tickets.config.upload
  return path.resolve(staticDir ?? 'tickets', filename)
}

const privateCollections: CollectionSlug[] = [
  'participations',
  'contacts',
  'consent-records',
  'tickets',
  'draws',
  'winners',
]

describe('access', () => {
  it.each(privateCollections)('hides %s from the public', async (collection) => {
    await expect(payload.find({ collection, overrideAccess: false })).rejects.toThrow()
  })

  it.each(privateCollections)('shows %s to staff', async (collection) => {
    await expect(
      payload.find({ collection, user: commercial, overrideAccess: false }),
    ).resolves.toBeDefined()
  })

  it('lets no one edit a participation, even an admin', async () => {
    await expect(
      payload.update({
        collection: 'participations',
        id: participation.id,
        data: { name: 'Edited' },
        user: admin,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('lets no one edit a contact', async () => {
    await expect(
      payload.update({
        collection: 'contacts',
        id: contact.id,
        data: { name: 'Edited' },
        user: admin,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('lets no one create participations through the API', async () => {
    await expect(
      payload.create({
        collection: 'participations',
        data: { ...participation, id: undefined } as never,
        user: admin,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('refuses deletion by a commercial user', async () => {
    await expect(
      payload.delete({
        collection: 'participations',
        id: participation.id,
        user: commercial,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})

describe('storeTicket', () => {
  it('strips metadata, applies the orientation and hashes the stored bytes', async () => {
    const stored = await readFile(ticketPath(ticket.filename!))
    const metadata = await sharp(stored).metadata()

    expect(metadata.format).toBe('jpeg')
    expect(metadata.exif).toBeUndefined()
    expect(metadata.orientation).toBeUndefined()
    // 60×40 rotated by its orientation flag.
    expect([metadata.width, metadata.height]).toEqual([40, 60])
    expect(ticket.hash).toBe(sha256(stored))
  })

  it('stores a small thumbnail for the admin list', async () => {
    const thumbnail = ticket.sizes?.thumbnail
    expect(thumbnail?.filename).toBe(`${path.parse(ticket.filename!).name}-160x160.webp`)
    const metadata = await sharp(await readFile(ticketPath(thumbnail!.filename!))).metadata()
    expect([metadata.format, metadata.width, metadata.height]).toEqual(['webp', 160, 160])
  })

  it('removes the photo and its thumbnail when a record was never created', async () => {
    const other = await createDraftContest(payload)
    try {
      const copy = await storeTicket(payload, { contestId: other.id, data: await phonePhoto(2) })
      await removeTicketFiles(payload, { filename: copy.filename })
      await expect(readFile(ticketPath(copy.filename!))).rejects.toThrow()
      await expect(readFile(ticketPath(copy.sizes!.thumbnail!.filename!))).rejects.toThrow()
    } finally {
      await payload.delete({ collection: 'tickets', where: { contest: { equals: other.id } } })
      await payload.delete({ collection: 'contests', id: other.id })
    }
  })

  it('refuses the same photo twice in a contest', async () => {
    await expect(
      storeTicket(payload, { contestId: contest.id, data: await phonePhoto(1) }),
    ).rejects.toMatchObject({ reason: 'duplicate' })
  })

  it('enforces (contest, hash) uniqueness in the database', async () => {
    const image = await readFile(ticketPath(ticket.filename!))
    // Payload writes the file before the insert fails, so remove it afterwards.
    const name = `duplicate-${randomUUID()}.jpg`
    try {
      await expect(
        payload.create({
          collection: 'tickets',
          data: { contest: contest.id, hash: ticket.hash, uploadedAt: new Date().toISOString() },
          file: { data: image, mimetype: 'image/jpeg', name, size: image.length },
        }),
      ).rejects.toThrow()
    } finally {
      await rm(ticketPath(name), { force: true })
    }
  })

  it('accepts the same photo in another contest', async () => {
    const other = await createDraftContest(payload)
    try {
      const copy = await storeTicket(payload, { contestId: other.id, data: await phonePhoto(1) })
      expect(copy.hash).toBe(ticket.hash)
    } finally {
      await payload.delete({ collection: 'tickets', where: { contest: { equals: other.id } } })
      await payload.delete({ collection: 'contests', id: other.id })
    }
  })

  it.each([
    ['not an image', Buffer.from('%PDF-1.7 not a photo')],
    [
      'a GIF',
      Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64'),
    ],
  ])('refuses %s', async (_, data) => {
    const error = await storeTicket(payload, { contestId: contest.id, data }).catch((e) => e)
    expect(error).toBeInstanceOf(TicketRejectedError)
    expect(error.reason).toBe('unsupported-format')
  })

  it('refuses files over the size limit before decoding them', async () => {
    await expect(
      storeTicket(payload, { contestId: contest.id, data: Buffer.alloc(10 * 1024 * 1024 + 1) }),
    ).rejects.toMatchObject({ reason: 'too-large' })
  })
})

describe('winners', () => {
  it('lets staff edit the publication but not the draw result', async () => {
    const draw = await payload.create({
      collection: 'draws',
      data: {
        contest: contest.id,
        periodStart: contest.startAt,
        periodEnd: contest.endAt,
        poolStart: contest.startAt,
        eligibleCount: 1,
        poolHash: sha256(Buffer.from(String(participation.id))),
        executedAt: new Date().toISOString(),
        executedBy: admin.id,
        algorithmVersion: 'test',
        status: 'completed',
      },
    })
    const winner = await payload.create({
      collection: 'winners',
      data: {
        draw: draw.id,
        participation: participation.id,
        rank: 1,
        selectedAt: new Date().toISOString(),
        publicDisplayName: 'Amine B.',
      },
    })

    try {
      const updated = await payload.update({
        collection: 'winners',
        id: winner.id,
        data: { published: true, rank: 2, voided: true },
        user: commercial,
        overrideAccess: false,
      })
      expect(updated).toMatchObject({ published: true, rank: 1, voided: false })

      await expect(
        payload.delete({ collection: 'draws', id: draw.id, user: admin, overrideAccess: false }),
      ).rejects.toThrow()
    } finally {
      await payload.delete({ collection: 'winners', id: winner.id })
      await payload.delete({ collection: 'draws', id: draw.id })
    }
  })
})
