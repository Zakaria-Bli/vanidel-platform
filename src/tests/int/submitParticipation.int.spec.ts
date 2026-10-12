import { randomInt } from 'node:crypto'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ParticipationError,
  submitParticipation,
  type ParticipationInput,
} from '@/modules/contests/services/submitParticipation'
import type { Contest } from '@/payload-types'

import { createDraftContest, createPublishedContest } from './helpers/contests'
import { phonePhoto } from './helpers/images'
import { getMigratedPayload } from './helpers/payload'

const day = 24 * 60 * 60 * 1000

let payload: Payload
let contest: Contest
const contestIds: number[] = []
let photoSeed = randomInt(1_000_000)

/** A fresh mobile number in local format, e.g. 0555123456. */
const newPhone = () => `05${String(randomInt(100_000_000)).padStart(8, '0')}`
/** A photo no other test has used, so its hash is unique. */
const newPhoto = () => phonePhoto(photoSeed++)

async function input(overrides: Partial<ParticipationInput> = {}): Promise<ParticipationInput> {
  return {
    contestSlug: contest.slug,
    locale: 'fr',
    name: 'Amine Benali',
    phone: newPhone(),
    wilaya: '16',
    consents: { regulation: true, dataProcessing: true, marketing: false },
    ticket: await newPhoto(),
    ...overrides,
  }
}

const refused = (code: string, field?: string) =>
  expect.objectContaining({ name: 'ParticipationError', code, ...(field ? { field } : {}) })

async function ticketFiles(): Promise<string[]> {
  const dir = path.resolve(payload.collections.tickets.config.upload.staticDir ?? 'tickets')
  return readdir(dir).catch(() => [])
}

async function publishedContest(changes: Partial<Contest> = {}): Promise<Contest> {
  const created = await createPublishedContest(payload)
  contestIds.push(created.id)
  return Object.keys(changes).length > 0
    ? payload.update({ collection: 'contests', id: created.id, data: changes })
    : created
}

beforeAll(async () => {
  payload = await getMigratedPayload()
  contest = await publishedContest()
}, 30_000)

afterAll(async () => {
  if (!payload) return
  const byContest = { contest: { in: contestIds } }
  await payload.delete({
    collection: 'consent-records',
    where: { 'participation.contest': { in: contestIds } },
  })
  await payload.delete({ collection: 'participations', where: byContest })
  await payload.delete({ collection: 'contacts', where: { firstContest: { in: contestIds } } })
  await payload.delete({ collection: 'tickets', where: byContest })
  await payload.delete({ collection: 'contests', where: { id: { in: contestIds } } })
  await payload.destroy()
})

describe('an accepted participation', () => {
  it('stores the snapshot, contact, ticket and every consent decision', async () => {
    const submission = await input({
      name: '  Amine  Benali ',
      email: 'Amine@Example.com',
      locale: 'ar',
      consents: { regulation: true, dataProcessing: true, marketing: true },
      attribution: {
        source: 'qr',
        utmSource: 'qr',
        utmCampaign: 'rentree',
        landedAt: new Date().toISOString(),
      },
    })
    const result = await submitParticipation(payload, submission)

    const participation = await payload.findByID({
      collection: 'participations',
      id: result.participationId,
      depth: 0,
    })
    expect(participation).toMatchObject({
      contest: contest.id,
      contact: result.contactId,
      ticket: result.ticketId,
      // As submitted, only trimmed.
      name: 'Amine  Benali',
      phone: submission.phone,
      phoneNormalized: `+213${submission.phone.slice(1)}`,
      email: 'Amine@Example.com',
      wilaya: '16',
      locale: 'ar',
      source: 'qr',
      utmSource: 'qr',
      utmCampaign: 'rentree',
    })
    expect(Date.parse(participation.periodStart)).toBeLessThanOrEqual(
      Date.parse(participation.submittedAt),
    )

    const contact = await payload.findByID({ collection: 'contacts', id: result.contactId })
    expect(contact).toMatchObject({
      phoneNormalized: participation.phoneNormalized,
      name: 'Amine  Benali',
      emailNormalized: 'amine@example.com',
    })

    const { docs: consents } = await payload.find({
      collection: 'consent-records',
      where: { participation: { equals: result.participationId } },
    })
    expect(
      consents
        .map(({ type, granted, textVersion }) => [type, granted, textVersion])
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    ).toEqual([
      ['dataProcessing', true, 'd1'],
      ['marketing', true, 'm1'],
      ['regulation', true, 'r1'],
    ])
  })

  it('records a refused optional consent as not granted', async () => {
    const result = await submitParticipation(payload, await input())
    const { docs } = await payload.find({
      collection: 'consent-records',
      where: { participation: { equals: result.participationId }, type: { equals: 'marketing' } },
    })
    expect(docs.map(({ granted }) => granted)).toEqual([false])
  })

  it('reuses the contact for the same phone without updating it', async () => {
    const phone = newPhone()
    const first = await submitParticipation(payload, await input({ phone, name: 'Amine' }))
    const second = await submitParticipation(
      payload,
      await input({ phone, name: 'Samira', now: new Date(Date.now() + 8 * day) }),
    )

    expect(second.contactId).toBe(first.contactId)
    const contact = await payload.findByID({ collection: 'contacts', id: first.contactId })
    expect(contact.name).toBe('Amine')
    const participation = await payload.findByID({
      collection: 'participations',
      id: second.participationId,
    })
    expect(participation.name).toBe('Samira')
  })
})

describe('duplicate prevention', () => {
  it('refuses a phone over its entry limit within the draw period', async () => {
    const phone = newPhone()
    await submitParticipation(payload, await input({ phone }))

    await expect(
      submitParticipation(payload, await input({ phone: `+213${phone.slice(1)}` })),
    ).rejects.toEqual(refused('entry-limit', 'phone'))
  })

  it('accepts the same phone again in the next period', async () => {
    const phone = newPhone()
    await submitParticipation(payload, await input({ phone }))

    await expect(
      submitParticipation(payload, await input({ phone, now: new Date(Date.now() + 8 * day) })),
    ).resolves.toBeDefined()
  })

  it('refuses the same receipt photo twice in a contest, leaving no file behind', async () => {
    const ticket = await newPhoto()
    await submitParticipation(payload, await input({ ticket }))
    const files = await ticketFiles()

    await expect(submitParticipation(payload, await input({ ticket }))).rejects.toEqual(
      refused('duplicate-ticket', 'ticket'),
    )
    expect(await ticketFiles()).toEqual(files)
  })

  it('lets only one of two simultaneous entries from a phone through', async () => {
    const phone = newPhone()
    const results = await Promise.allSettled([
      submitParticipation(payload, await input({ phone })),
      submitParticipation(payload, await input({ phone })),
    ])

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(results.find(({ status }) => status === 'rejected')).toMatchObject({
      reason: refused('entry-limit'),
    })
  })

  it('lets only one of two simultaneous uploads of the same receipt through', async () => {
    const ticket = await newPhoto()
    const results = await Promise.allSettled([
      submitParticipation(payload, await input({ ticket })),
      submitParticipation(payload, await input({ ticket })),
    ])

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(results.find(({ status }) => status === 'rejected')).toMatchObject({
      reason: refused('duplicate-ticket'),
    })
  })
})

describe('refused submissions', () => {
  it.each<[string, Partial<ParticipationInput>, string, string?]>([
    ['an empty name', { name: '  ' }, 'invalid-name', 'name'],
    ['a name without letters', { name: '1234' }, 'invalid-name', 'name'],
    ['a landline', { phone: '021123456' }, 'invalid-phone', 'phone'],
    ['a malformed email', { email: 'amine@' }, 'invalid-email', 'email'],
    ['an unknown wilaya', { wilaya: '70' }, 'invalid-wilaya', 'wilaya'],
    ['a missing wilaya', { wilaya: '' }, 'invalid-wilaya', 'wilaya'],
    [
      'a missing required consent',
      { consents: { regulation: true, dataProcessing: false } },
      'consent-required',
      'consent.dataProcessing',
    ],
    ['no ticket', { ticket: Buffer.alloc(0) }, 'ticket-missing', 'ticket'],
    ['a ticket that is not an image', { ticket: Buffer.from('%PDF-1.7') }, 'ticket-unsupported'],
    ['an unknown contest', { contestSlug: 'nope' }, 'contest-not-found'],
  ])('refuses %s', async (_, overrides, code, field) => {
    await expect(submitParticipation(payload, await input(overrides))).rejects.toEqual(
      refused(code, field),
    )
  })

  it('refuses a draft contest as unknown', async () => {
    const draft = await createDraftContest(payload)
    contestIds.push(draft.id)
    await expect(
      submitParticipation(payload, await input({ contestSlug: draft.slug })),
    ).rejects.toEqual(refused('contest-not-found'))
  })

  it('refuses before the start and after the end', async () => {
    const now = Date.now()
    await expect(
      submitParticipation(payload, await input({ now: new Date(now - 2 * day) })),
    ).rejects.toEqual(refused('contest-not-open'))
    await expect(
      submitParticipation(payload, await input({ now: new Date(now + 30 * day) })),
    ).rejects.toEqual(refused('contest-closed'))
  })

  it('follows the contest email setting', async () => {
    const required = await publishedContest({ form: { email: 'required', wilayaRequired: true } })
    await expect(
      submitParticipation(payload, await input({ contestSlug: required.slug })),
    ).rejects.toEqual(refused('invalid-email', 'email'))

    const off = await publishedContest({ form: { email: 'off', wilayaRequired: false } })
    const result = await submitParticipation(
      payload,
      await input({ contestSlug: off.slug, email: 'ignored@example.com', wilaya: '' }),
    )
    const participation = await payload.findByID({
      collection: 'participations',
      id: result.participationId,
    })
    expect(participation.email).toBeFalsy()
    expect(participation.wilaya).toBeFalsy()
  })

  it('rolls everything back, ticket file included, when a later write fails', async () => {
    const files = await ticketFiles()
    const phone = newPhone()
    const create = payload.create.bind(payload)
    const spy = vi.spyOn(payload, 'create').mockImplementation((async (args: {
      collection: string
    }) => {
      if (args.collection === 'participations') throw new Error('database down')
      return create(args as never)
    }) as never)

    try {
      await expect(submitParticipation(payload, await input({ phone }))).rejects.toThrow(
        'database down',
      )
    } finally {
      spy.mockRestore()
    }

    expect(await ticketFiles()).toEqual(files)
    const { totalDocs } = await payload.count({
      collection: 'contacts',
      where: { phoneNormalized: { equals: `+213${phone.slice(1)}` } },
    })
    expect(totalDocs).toBe(0)
  })

  it('reports refusals as ParticipationError', async () => {
    const error = await submitParticipation(payload, await input({ name: '' })).catch((e) => e)
    expect(error).toBeInstanceOf(ParticipationError)
  })
})
