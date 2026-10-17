import { randomInt } from 'node:crypto'
import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { env } from '@/lib/env'
import { attributionFromSearch } from '@/modules/analytics/domain/attribution'
import { campaignCodeMaxLength, campaignLinkUrl } from '@/modules/analytics/domain/campaignLinks'
import { contestReport } from '@/modules/analytics/queries/contestReport'
import { submitParticipation } from '@/modules/contests/services/submitParticipation'
import type { Contest, User } from '@/payload-types'
import { contestReportEndpoint, reportCsv } from '@/payload/endpoints/reports'

import { createPublishedContest, consentVersionsOf } from './helpers/contests'
import { phonePhoto } from './helpers/images'
import { createUser, getMigratedPayload } from './helpers/payload'

let payload: Payload
let contest: Contest
let operator: User
let photoSeed = randomInt(1_000_000)

const newPhone = () => `05${String(randomInt(100_000_000)).padStart(8, '0')}`

/** Submits an entry as a visitor who landed on `url` (or on no tagged link). */
async function enter(url: string | null, wilaya = '16', marketing = false, phone = newPhone()) {
  await submitParticipation(payload, {
    contestSlug: contest.slug,
    locale: 'fr',
    name: 'Amine Benali',
    phone,
    wilaya,
    consents: { regulation: true, dataProcessing: true, marketing },
    consentVersions: consentVersionsOf(contest),
    ticket: await phonePhoto(photoSeed++),
    attribution: url ? attributionFromSearch(new URL(url).searchParams) : null,
  })
}

beforeAll(async () => {
  payload = await getMigratedPayload()
  operator = await createUser(payload, 'commercial')
  contest = await createPublishedContest(payload)
  contest = await payload.update({
    collection: 'contests',
    id: contest.id,
    data: { entryLimitPerPhone: 2 },
  })
}, 30_000)

afterAll(async () => {
  if (!payload) return
  const byContest = { contest: { equals: contest.id } }
  await payload.delete({ collection: 'campaign-links', where: byContest })
  await payload.delete({
    collection: 'consent-records',
    where: { 'participation.contest': { equals: contest.id } },
  })
  await payload.delete({ collection: 'participations', where: byContest })
  await payload.delete({ collection: 'contacts', where: { firstContest: { equals: contest.id } } })
  await payload.delete({ collection: 'tickets', where: byContest })
  await payload.delete({ collection: 'contests', id: contest.id })
  await payload.delete({ collection: 'users', id: operator.id })
  await payload.destroy()
})

describe('contestReport', () => {
  it('counts entries per tracked link, wilaya and period, listing links without entries', async () => {
    const site = 'https://vanidel.example'
    const create = (name: string, channel: 'qr' | 'influencer' | 'tiktok', code?: string) =>
      payload.create({
        collection: 'campaign-links',
        data: { name, contest: contest.id, channel, code },
      })
    const qr = await create('Emballage 1 kg', 'qr')
    const sarah = await create('Instagram Sarah', 'influencer', 'sarah')
    await create('TikTok', 'tiktok')
    expect(qr.url).toBe(campaignLinkUrl(env.SITE_URL, contest.slug, { channel: 'qr' }))

    const qrUrl = campaignLinkUrl(site, contest.slug, { channel: 'qr' })
    const repeat = newPhone()
    await enter(qrUrl, '16', true, repeat)
    await enter(qrUrl, '16', false, repeat)
    await enter(qrUrl, '31')
    await enter(campaignLinkUrl(site, contest.slug, { channel: 'influencer', code: 'sarah' }), '31')
    await enter(null, '09')

    const report = await contestReport(payload, contest.id)
    expect(report?.totals).toEqual({ participations: 5, uniquePhones: 4, marketingOptIns: 0 })
    expect(report?.channels).toEqual([
      {
        source: 'qr',
        medium: 'packaging',
        content: null,
        links: ['Emballage 1 kg'],
        participations: 3,
        uniquePhones: 2,
      },
      {
        source: null,
        medium: null,
        content: null,
        links: [],
        participations: 1,
        uniquePhones: 1,
      },
      {
        source: 'influencer',
        medium: 'influencer',
        content: 'sarah',
        links: [sarah.name],
        participations: 1,
        uniquePhones: 1,
      },
      {
        source: 'tiktok',
        medium: 'social',
        content: null,
        links: ['TikTok'],
        participations: 0,
        uniquePhones: 0,
      },
    ])
    expect(report?.wilayas).toEqual([
      { code: '16', participations: 2 },
      { code: '31', participations: 2 },
      { code: '09', participations: 1 },
    ])
    expect(report?.periods).toEqual([{ periodStart: expect.any(String), participations: 5 }])
    expect(report?.draws).toEqual({ draws: 0, redraws: 0, winners: 0, published: 0, voided: 0 })

    const csv = reportCsv(report!)
    expect(csv).toContain('channel,qr,packaging,Emballage 1 kg,3,2')
    expect(csv).toContain('wilaya,31,Oran,,2,')
  })

  it('counts a code of the maximum length under its link, and refuses a longer one', async () => {
    const longest = 'a'.repeat(campaignCodeMaxLength)
    const link = await payload.create({
      collection: 'campaign-links',
      data: { name: 'Longest code', contest: contest.id, channel: 'influencer', code: longest },
    })
    await expect(
      payload.create({
        collection: 'campaign-links',
        data: { name: 'Too long', contest: contest.id, channel: 'influencer', code: `${longest}b` },
      }),
    ).rejects.toThrow()

    await enter(link.url!)
    const row = (await contestReport(payload, contest.id))?.channels.find(({ links }) =>
      links.includes('Longest code'),
    )
    expect(row).toMatchObject({ content: longest, participations: 1 })
  })

  it('reports nothing for an unknown contest', async () => {
    expect(await contestReport(payload, 999_999_999)).toBeNull()
  })

  it('is for staff only', async () => {
    const call = async (user: User | null) => {
      const req = {
        payload,
        user,
        routeParams: { id: String(contest.id) },
        searchParams: new URLSearchParams(),
      }
      return contestReportEndpoint.handler(req as never)
    }
    expect((await call(null)).status).toBe(403)
    expect((await call(operator)).status).toBe(200)
  })
})
