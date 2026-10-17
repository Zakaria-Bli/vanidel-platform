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

  it('saves edits to a published contest in the language being edited', async () => {
    const contest = await track(createPublishedContest(payload))

    for (const [locale, title] of [
      ['fr', 'Nouveau titre'],
      ['ar', 'عنوان جديد'],
    ] as const) {
      const updated = await payload.update({
        collection: 'contests',
        id: contest.id,
        locale,
        data: { title },
      })
      expect(updated.title).toBe(title)
    }

    const stored = await payload.findByID({
      collection: 'contests',
      id: contest.id,
      locale: 'all',
      depth: 0,
    })
    expect(stored.title).toEqual({ fr: 'Nouveau titre', ar: 'عنوان جديد' })
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
          },
          {
            type: 'dataProcessing',
            required: true,
            label: 'J’accepte le traitement de mes données.',
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

  it('refuses a last day before the first day, and allows a one-day contest', async () => {
    const contest = await track(createDraftContest(payload))
    const dayBefore = new Date(Date.parse(contest.startAt) - 12 * 60 * 60 * 1000).toISOString()

    await expect(
      payload.update({ collection: 'contests', id: contest.id, data: { endAt: dayBefore } }),
    ).rejects.toThrow()
    const oneDay = await payload.update({
      collection: 'contests',
      id: contest.id,
      data: { endAt: contest.startAt },
    })
    expect(Date.parse(oneDay.endAt) - Date.parse(oneDay.startAt)).toBe(24 * 60 * 60 * 1000 - 1)
  })
})

describe('contest days', () => {
  it('runs from 00:00 on the first day to 23:59:59.999 on the last, Algiers time', async () => {
    const contest = await track(
      payload.create({
        collection: 'contests',
        locale: 'fr',
        // What the admin's day-only picker sends: noon UTC on the chosen days.
        data: {
          ...draftContestData(),
          startAt: '2026-11-01T12:00:00.000Z',
          endAt: '2026-11-30T12:00:00.000Z',
        },
      }),
    )
    expect([contest.startAt, contest.endAt]).toEqual([
      '2026-10-31T23:00:00.000Z',
      '2026-11-30T22:59:59.999Z',
    ])

    // Saving again keeps the same days.
    const saved = await payload.update({
      collection: 'contests',
      id: contest.id,
      data: { startAt: contest.startAt, endAt: contest.endAt },
    })
    expect([saved.startAt, saved.endAt]).toEqual([contest.startAt, contest.endAt])
  })
})

describe('consent text versions', () => {
  const versions = (contest: { consents?: { textVersion?: string | null }[] | null }) =>
    (contest.consents ?? []).map(({ textVersion }) => textVersion)

  it('follows the wording in every language, whatever is sent', async () => {
    const draft = await track(
      payload.create({
        collection: 'contests',
        locale: 'fr',
        data: {
          ...draftContestData(),
          consents: draftContestData().consents?.map((row) => ({ ...row, textVersion: 'typed' })),
        },
      }),
    )
    const created = versions(draft)
    expect(created).toEqual([expect.any(String), expect.any(String), expect.any(String)])
    expect(new Set(created).size).toBe(3)
    expect(created).not.toContain('typed')

    // Adding the Arabic text changes every version.
    const translated = await translateToArabic(payload, draft.id)
    versions(translated).forEach((version, index) => expect(version).not.toBe(created[index]))

    // Saving unchanged text keeps them; editing one text changes only its version.
    const french = await payload.findByID({ collection: 'contests', id: draft.id, locale: 'fr' })
    const resaved = await payload.update({
      collection: 'contests',
      id: draft.id,
      locale: 'fr',
      data: { consents: french.consents },
    })
    expect(versions(resaved)).toEqual(versions(translated))
    const edited = await payload.update({
      collection: 'contests',
      id: draft.id,
      locale: 'ar',
      data: {
        consents: (translated.consents ?? []).map((row, index) =>
          index === 0 ? { ...row, label: 'أوافق على نظام المسابقة.' } : { ...row, label: 'أوافق.' },
        ),
      },
    })
    expect(versions(edited)[0]).not.toBe(versions(translated)[0])
    expect(versions(edited).slice(1)).toEqual(versions(translated).slice(1))
  })
})
