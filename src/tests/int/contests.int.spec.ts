import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

import {
  createDraftContest,
  createPublishedContest,
  draftContestData,
  translateToArabic,
} from './helpers/contests'
import { createUser, getMigratedPayload } from './helpers/payload'

let payload: Payload
let commercial: User
const contestIds: number[] = []

beforeAll(async () => {
  payload = await getMigratedPayload()
  commercial = await createUser(payload, 'commercial')
}, 30_000)

afterAll(async () => {
  if (contestIds.length > 0) {
    await payload?.delete({ collection: 'contests', where: { id: { in: contestIds } } })
  }
  if (commercial) await payload?.delete({ collection: 'users', id: commercial.id })
  await payload?.destroy()
})

async function track<T extends { id: number }>(contest: Promise<T>): Promise<T> {
  const created = await contest
  contestIds.push(created.id)
  return created
}

describe('contest visibility', () => {
  it('hides drafts from the public and shows published contests', async () => {
    const draft = await track(createDraftContest(payload))
    const published = await track(createPublishedContest(payload))

    const { docs } = await payload.find({
      collection: 'contests',
      where: { id: { in: [draft.id, published.id] } },
      overrideAccess: false,
    })

    expect(docs.map(({ id }) => id)).toEqual([published.id])
  })

  it('shows drafts to staff', async () => {
    const draft = await track(createDraftContest(payload))

    const found = await payload.findByID({
      collection: 'contests',
      id: draft.id,
      user: commercial,
      overrideAccess: false,
    })
    expect(found.id).toBe(draft.id)
  })
})

describe('publishing', () => {
  const missing = (field: string) => ({
    data: { errors: [{ path: 'status', message: expect.stringContaining(field) }] },
  })

  it('refuses to publish while the Arabic content is missing', async () => {
    const draft = await track(createDraftContest(payload))

    await expect(
      payload.update({ collection: 'contests', id: draft.id, data: { status: 'published' } }),
    ).rejects.toMatchObject(missing('title (ar)'))
  })

  it('publishes once every language is filled', async () => {
    const draft = await track(createDraftContest(payload))
    await translateToArabic(payload, draft.id)

    const published = await payload.update({
      collection: 'contests',
      id: draft.id,
      data: { status: 'published' },
    })
    expect(published.status).toBe('published')
  })

  it('checks nested fields too', async () => {
    const draft = await track(createDraftContest(payload))
    await translateToArabic(payload, draft.id)
    await payload.update({
      collection: 'contests',
      id: draft.id,
      locale: 'fr',
      data: { seo: { title: null } },
    })

    await expect(
      payload.update({ collection: 'contests', id: draft.id, data: { status: 'published' } }),
    ).rejects.toMatchObject(missing('seo.title (fr)'))
  })
})

describe('translated rows', () => {
  // The publication error, listing every given field (in any order).
  const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const missing = (...fields: string[]) => ({
    data: {
      errors: [
        {
          path: 'status',
          message: expect.stringMatching(
            new RegExp(fields.map((field) => `(?=.*${escape(field)})`).join('')),
          ),
        },
      ],
    },
  })

  /** A contest whose texts are translated but whose prize and consent are French only. */
  async function withFrenchOnlyRows() {
    const draft = await track(createDraftContest(payload))
    await translateToArabic(payload, draft.id)
    return payload.update({
      collection: 'contests',
      id: draft.id,
      locale: 'fr',
      data: {
        prizes: [{ title: 'Panier', quantity: 2 }],
        consents: [
          {
            type: 'regulation',
            required: true,
            label: 'J’accepte le règlement.',
            textVersion: 'v1',
          },
          {
            type: 'dataProcessing',
            required: true,
            label: 'J’accepte le traitement de mes données.',
            textVersion: 'v1',
          },
        ],
      },
    })
  }

  it('refuses to publish with French-only prizes and consent texts', async () => {
    const draft = await withFrenchOnlyRows()

    await expect(
      payload.update({ collection: 'contests', id: draft.id, data: { status: 'published' } }),
    ).rejects.toMatchObject(missing('prizes.0.title (ar)', 'consents.0.label (ar)'))
  })

  it('publishes once every row is translated', async () => {
    const draft = await withFrenchOnlyRows()
    // Array rows keep their IDs across locales.
    const [prize] = draft.prizes ?? []
    await payload.update({
      collection: 'contests',
      id: draft.id,
      locale: 'ar',
      data: {
        prizes: [{ ...prize, title: 'سلة' }],
        consents: (draft.consents ?? []).map((row) => ({ ...row, label: 'أوافق.' })),
      },
    })

    const published = await payload.update({
      collection: 'contests',
      id: draft.id,
      data: { status: 'published' },
    })
    expect(published.status).toBe('published')
  })

  it('refuses to publish without any step', async () => {
    const draft = await track(createDraftContest(payload))
    await translateToArabic(payload, draft.id)
    await payload.update({ collection: 'contests', id: draft.id, data: { steps: [] } })

    await expect(
      payload.update({ collection: 'contests', id: draft.id, data: { status: 'published' } }),
    ).rejects.toMatchObject(missing('steps (at least one)'))
  })

  it('refuses a French-only step added to a published contest', async () => {
    const published = await track(createPublishedContest(payload))

    await expect(
      payload.update({
        collection: 'contests',
        id: published.id,
        locale: 'fr',
        data: { steps: [...(published.steps ?? []), { text: 'Nouvelle étape' }] },
      }),
    ).rejects.toMatchObject(missing('steps.1.text (ar)'))
  })

  it('refuses a French-only prize added to a published contest', async () => {
    const published = await track(createPublishedContest(payload))

    await expect(
      payload.update({
        collection: 'contests',
        id: published.id,
        locale: 'fr',
        data: { prizes: [{ title: 'Nouveau lot' }] },
      }),
    ).rejects.toMatchObject(missing('prizes.0.title (ar)'))
  })
})

describe('whole numbers', () => {
  it.each([
    ['period length', { draw: { periodDays: 1.5, winnersPerDraw: 1 } }],
    ['winners per draw', { draw: { periodDays: 7, winnersPerDraw: 1.5 } }],
    ['entry limit', { entryLimitPerPhone: 1.5 }],
    ['prize quantity', { prizes: [{ title: 'Panier', quantity: 1.5 }] }],
  ])('refuses a fractional %s', async (_, data) => {
    const contest = await track(createDraftContest(payload))

    await expect(
      payload.update({ collection: 'contests', id: contest.id, locale: 'fr', data }),
    ).rejects.toThrow()
  })

  it('still accepts whole numbers', async () => {
    const contest = await track(createDraftContest(payload))

    const updated = await payload.update({
      collection: 'contests',
      id: contest.id,
      data: { draw: { periodDays: 14, winnersPerDraw: 3 }, entryLimitPerPhone: 2 },
    })
    expect(updated).toMatchObject({
      draw: { periodDays: 14, winnersPerDraw: 3 },
      entryLimitPerPhone: 2,
    })
  })
})

describe('contest rules', () => {
  it('lets a commercial user create and edit but not delete', async () => {
    const contest = await track(createDraftContest(payload))

    const updated = await payload.update({
      collection: 'contests',
      id: contest.id,
      data: { entryLimitPerPhone: 2 },
      user: commercial,
      overrideAccess: false,
    })
    expect(updated.entryLimitPerPhone).toBe(2)

    await expect(
      payload.delete({
        collection: 'contests',
        id: contest.id,
        user: commercial,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('applies the participation and draw defaults', async () => {
    // Only what an editor must type; everything else should come from the field defaults.
    const { slug, title, startAt, endAt } = draftContestData()
    const contest = await track(
      payload.create({
        collection: 'contests',
        data: { slug, title, startAt, endAt } as ReturnType<typeof draftContestData>,
      }),
    )

    expect(contest.status).toBe('draft')
    expect(contest.form).toMatchObject({ email: 'optional', wilayaRequired: true })
    expect(contest.entryLimitPerPhone).toBe(1)
    expect(contest.draw).toMatchObject({ periodDays: 7, winnersPerDraw: 1 })
  })

  it('keeps slugs unique and URL-safe', async () => {
    const contest = await track(createDraftContest(payload))

    await expect(
      payload.update({ collection: 'contests', id: contest.id, data: { slug: 'Été 2026' } }),
    ).rejects.toThrow()

    await expect(
      payload.update({ collection: 'contests', id: contest.id, data: { slug: 'archives' } }),
    ).rejects.toThrow()

    const other = await track(createDraftContest(payload))
    await expect(
      payload.update({ collection: 'contests', id: other.id, data: { slug: contest.slug } }),
    ).rejects.toThrow()
  })

  it('requires the end to come after the start', async () => {
    const contest = await track(createDraftContest(payload))

    await expect(
      payload.update({
        collection: 'contests',
        id: contest.id,
        data: { endAt: contest.startAt },
      }),
    ).rejects.toThrow()
  })
})
