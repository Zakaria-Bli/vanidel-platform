import { randomInt } from 'node:crypto'
import { createLocalReq, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { submitParticipation } from '@/modules/contests/services/submitParticipation'
import type { Contest, User } from '@/payload-types'
import { exportMarketingContacts, exportParticipations } from '@/payload/endpoints/exports'

import { createPublishedContest, consentVersionsOf } from './helpers/contests'
import { phonePhoto } from './helpers/images'
import { createUser, getMigratedPayload } from './helpers/payload'

const day = 24 * 60 * 60 * 1000

let payload: Payload
let commercial: User
let contest: Contest
let otherContest: Contest
let photoSeed = randomInt(1_000_000)
const phones = {
  withdrew: '',
  consentedLater: '',
  consented: '',
  otherContest: '',
  neverConsented: '',
}

const newPhone = () => `07${String(randomInt(100_000_000)).padStart(8, '0')}`
const normalized = (phone: string) => `+213${phone.slice(1)}`

async function participate(
  target: Contest,
  phone: string,
  name: string,
  marketing: boolean,
  daysFromNow = 0,
) {
  return submitParticipation(payload, {
    contestSlug: target.slug,
    locale: 'fr',
    name,
    phone,
    // Differs per submission, to show which participation the export used.
    email: `${name.split(' ')[0].toLowerCase()}.${daysFromNow}@example.com`,
    wilaya: '31',
    consents: { regulation: true, dataProcessing: true, marketing },
    consentVersions: consentVersionsOf(target),
    ticket: await phonePhoto(photoSeed++),
    attribution: { source: 'qr', utmCampaign: 'rentree', landedAt: new Date().toISOString() },
    now: new Date(Date.now() + daysFromNow * day),
  })
}

async function call(
  endpoint: typeof exportParticipations,
  query = '',
  user: User | null = commercial,
): Promise<Response> {
  const req = await createLocalReq({ user: user ?? undefined, urlSuffix: query }, payload)
  if (!user) req.user = null
  return endpoint.handler(req) as Promise<Response>
}

async function csvRows(response: Response): Promise<string[][]> {
  const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await response.arrayBuffer())
  expect(text.charCodeAt(0)).toBe(0xfeff)
  return text
    .slice(1)
    .trimEnd()
    .split('\r\n')
    .map((line) => line.split(','))
}

beforeAll(async () => {
  payload = await getMigratedPayload()
  commercial = await createUser(payload, 'commercial')
  contest = await createPublishedContest(payload)
  otherContest = await createPublishedContest(payload)
  for (const key of Object.keys(phones) as (keyof typeof phones)[]) phones[key] = newPhone()

  await participate(contest, phones.withdrew, 'Amine', true)
  await participate(contest, phones.withdrew, 'Amine', false, 8)
  await participate(contest, phones.consentedLater, 'Samira', false)
  await participate(contest, phones.consentedLater, 'Samira Benali', true, 8)
  await participate(contest, phones.consented, 'Yacine', true)
  await participate(otherContest, phones.otherContest, 'Lina', true)
  await participate(contest, phones.neverConsented, 'Karim', false)
}, 60_000)

afterAll(async () => {
  if (!payload) return
  const contests = [contest?.id, otherContest?.id].filter(Boolean)
  await payload.delete({
    collection: 'consent-records',
    where: { 'participation.contest': { in: contests } },
  })
  await payload.delete({ collection: 'participations', where: { contest: { in: contests } } })
  await payload.delete({ collection: 'contacts', where: { firstContest: { in: contests } } })
  await payload.delete({ collection: 'tickets', where: { contest: { in: contests } } })
  await payload.delete({ collection: 'contests', where: { id: { in: contests } } })
  if (commercial) await payload.delete({ collection: 'users', id: commercial.id })
  await payload.destroy()
})

describe('participation export', () => {
  it('is refused without a staff session', async () => {
    expect((await call(exportParticipations, '', null)).status).toBe(403)
  })

  it('lists a contest’s participations as submitted, with attribution', async () => {
    const response = await call(exportParticipations, `?contest=${contest.id}`)
    expect(response.headers.get('content-disposition')).toContain(`participations-${contest.id}-`)
    const [header, ...rows] = await csvRows(response)

    expect(header).toEqual([
      'submitted_at',
      'period_start',
      'contest',
      'name',
      'phone',
      'phone_normalized',
      'email',
      'wilaya_code',
      'wilaya',
      'language',
      'source',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'ticket',
    ])
    expect(rows).toHaveLength(6)
    expect(rows[0]).toMatchObject({
      2: contest.slug,
      3: 'Amine',
      5: normalized(phones.withdrew),
      7: '31',
      8: 'Oran',
      10: 'qr',
      13: 'rentree',
    })
    expect(rows[0][0]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })

  it('filters by Algiers calendar days', async () => {
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Africa/Algiers' }).format(
      new Date(),
    )
    const [, ...rows] = await csvRows(
      await call(exportParticipations, `?contest=${contest.id}&from=${today}&to=${today}`),
    )
    // The second entries of two phones were dated eight days later.
    expect(rows).toHaveLength(4)
  })

  it('rejects malformed filters', async () => {
    expect((await call(exportParticipations, '?contest=abc')).status).toBe(400)
    expect((await call(exportParticipations, '?from=15/10/2026')).status).toBe(400)
  })
})

describe('marketing contact export', () => {
  async function exportedPhones(query = '') {
    const [header, ...rows] = await csvRows(await call(exportMarketingContacts, query))
    expect(header[0]).toBe('phone')
    return new Map(rows.map((row) => [row[0], row]))
  }

  it('is refused without a staff session', async () => {
    expect((await call(exportMarketingContacts, '', null)).status).toBe(403)
  })

  it('includes only contacts whose latest marketing consent is granted', async () => {
    const exported = await exportedPhones()

    expect(exported.has(normalized(phones.consented))).toBe(true)
    expect(exported.has(normalized(phones.consentedLater))).toBe(true)
    expect(exported.has(normalized(phones.otherContest))).toBe(true)
    expect(exported.has(normalized(phones.withdrew))).toBe(false)
    expect(exported.has(normalized(phones.neverConsented))).toBe(false)
  })

  it('takes name and email from the latest participation', async () => {
    const row = (await exportedPhones()).get(normalized(phones.consentedLater))
    expect(row?.slice(1, 5)).toEqual(['Samira Benali', 'samira.8@example.com', '31', 'Oran'])
  })

  it('can be limited to one contest’s participants', async () => {
    const exported = await exportedPhones(`?contest=${contest.id}`)
    expect(exported.has(normalized(phones.consented))).toBe(true)
    expect(exported.has(normalized(phones.otherContest))).toBe(false)
  })
})
