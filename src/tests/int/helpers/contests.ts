import { randomUUID } from 'node:crypto'
import type { Payload, RequiredDataFromCollectionSlug } from 'payload'

import type { Contest } from '@/payload-types'

import { paragraph } from './richText'

const day = 24 * 60 * 60 * 1000

/** A draft contest with French content only, open from yesterday for four weeks. */
export function draftContestData(): RequiredDataFromCollectionSlug<'contests'> {
  return {
    status: 'draft',
    form: { email: 'off', wilayaRequired: true },
    entryLimitPerPhone: 1,
    draw: { periodDays: 7, winnersPerDraw: 1 },
    slug: `test-${randomUUID()}`,
    title: 'Grand concours',
    description: paragraph('Gagnez des lots.'),
    participationInstructions: paragraph('Envoyez votre ticket.'),
    seo: { title: 'Grand concours' },
    startAt: new Date(Date.now() - day).toISOString(),
    endAt: new Date(Date.now() + 28 * day).toISOString(),
  }
}

export async function createDraftContest(payload: Payload): Promise<Contest> {
  return payload.create({ collection: 'contests', locale: 'fr', data: draftContestData() })
}

/** Adds the Arabic content a contest needs before it can be published. */
export async function translateToArabic(payload: Payload, id: number): Promise<Contest> {
  return payload.update({
    collection: 'contests',
    id,
    locale: 'ar',
    data: {
      title: 'المسابقة الكبرى',
      description: paragraph('اربحوا جوائز.'),
      participationInstructions: paragraph('أرسلوا تذكرتكم.'),
      seo: { title: 'المسابقة الكبرى' },
    },
  })
}

export async function createPublishedContest(payload: Payload): Promise<Contest> {
  const draft = await createDraftContest(payload)
  await translateToArabic(payload, draft.id)
  return payload.update({ collection: 'contests', id: draft.id, data: { status: 'published' } })
}
