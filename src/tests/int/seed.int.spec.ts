import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

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
    expect(
      contest.prizes?.map(({ title }) => Object.keys(title as unknown as object).sort()),
    ).toEqual([
      ['ar', 'fr'],
      ['ar', 'fr'],
    ])
    expect(contest.consents?.map(({ type, required }) => [type, required])).toEqual([
      ['regulation', true],
      ['marketing', false],
    ])
  })
})
