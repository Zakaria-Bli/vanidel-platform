import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { consentTextVersion } from '@/modules/contests/domain/consentVersion'
import { seed, seedContestSlug } from '@/seed/seed'

import { getMigratedPayload } from './helpers/payload'

const emails = ['admin@vanidel.local', 'commercial@vanidel.local']
const options = { adminPassword: 'seed-admin-test', commercialPassword: 'seed-commercial-test' }

let payload: Payload

async function cleanUp() {
  await payload.delete({ collection: 'contests', where: { slug: { equals: seedContestSlug } } })
  await payload.delete({
    collection: 'media',
    where: { filename: { in: ['seed-hero.png', 'seed-share.png'] } },
  })
  await payload.delete({ collection: 'users', where: { email: { in: emails } } })
}

beforeAll(async () => {
  payload = await getMigratedPayload()
  await cleanUp()
}, 30_000)

afterAll(async () => {
  if (!payload) return
  await cleanUp()
  await payload.destroy()
})

describe('development seed', () => {
  it('creates both users and a published bilingual contest, idempotently', async () => {
    const first = await seed(payload, options)
    const second = await seed(payload, options)
    expect(second.id).toBe(first.id)

    const { docs: users } = await payload.find({
      collection: 'users',
      where: { email: { in: emails } },
      sort: 'email',
    })
    expect(users.map(({ email, role }) => [email, role])).toEqual([
      ['admin@vanidel.local', 'admin'],
      ['commercial@vanidel.local', 'commercial'],
    ])

    const contest = await payload.findByID({
      collection: 'contests',
      id: first.id,
      locale: 'all',
      depth: 0,
    })
    expect(contest.status).toBe('published')
    expect(contest.title).toMatchObject({ fr: expect.any(String), ar: expect.any(String) })
    // Every row is translated: six steps, one prize, three consents.
    const languagesOf = (value: unknown) => Object.keys(value as object).sort()
    expect(contest.steps?.map(({ text }) => languagesOf(text))).toEqual(Array(6).fill(['ar', 'fr']))
    expect(contest.prizes?.map(({ title }) => languagesOf(title))).toEqual([['ar', 'fr']])
    expect(contest.form).toMatchObject({ email: 'optional', wilayaRequired: true })
    // Read with `locale: 'all'`, each label holds every language.
    const versionOf = (label: unknown) => consentTextVersion(label as Record<string, string>)
    expect(
      contest.consents?.map(({ type, required, textVersion }) => [type, required, textVersion]),
    ).toEqual(
      contest.consents?.map(({ type, required, label }) => [type, required, versionOf(label)]),
    )
    expect(contest.consents?.map(({ label }) => languagesOf(label))).toEqual(
      Array(3).fill(['ar', 'fr']),
    )
  })
})
