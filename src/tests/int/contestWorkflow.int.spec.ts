import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Contest, User } from '@/payload-types'
import { contestChecklistEndpoint } from '@/payload/endpoints/checklist'

import { createDraftContest, createPublishedContest } from './helpers/contests'
import { createUser, getMigratedPayload } from './helpers/payload'

let payload: Payload
let operator: User
const contestIds: number[] = []

beforeAll(async () => {
  payload = await getMigratedPayload()
  operator = await createUser(payload, 'commercial')
}, 30_000)

afterAll(async () => {
  if (!payload) return
  await payload.delete({ collection: 'contests', where: { id: { in: contestIds } } })
  await payload.delete({ collection: 'users', id: operator.id })
  await payload.destroy()
})

const track = (contest: Contest) => {
  contestIds.push(contest.id)
  return contest
}

describe('duplicating a contest', () => {
  it('copies it as a draft under a free slug, keeping both languages', async () => {
    const original = track(await createPublishedContest(payload))
    const copy = track(await payload.duplicate({ collection: 'contests', id: original.id }))
    const second = track(await payload.duplicate({ collection: 'contests', id: original.id }))
    const ofCopy = track(await payload.duplicate({ collection: 'contests', id: copy.id }))

    expect(copy.status).toBe('draft')
    expect(copy.slug).toBe(`${original.slug}-copie`)
    expect(second.slug).toBe(`${original.slug}-copie-2`)
    expect(ofCopy.slug).toBe(`${original.slug}-copie-3`)

    const arabic = await payload.findByID({ collection: 'contests', id: copy.id, locale: 'ar' })
    expect(arabic.title).toBe('المسابقة الكبرى')
  })
})

describe('the publish checklist', () => {
  const call = async (id: number, user: User | null) => {
    const req = { payload, user, routeParams: { id: String(id) } }
    return contestChecklistEndpoint.handler(req as never)
  }

  it('names what a draft still lacks, for staff only', async () => {
    const draft = track(await createDraftContest(payload))
    expect((await call(draft.id, null)).status).toBe(403)

    const response = await call(draft.id, operator)
    expect(response.status).toBe(200)
    const { items } = (await response.json()) as {
      items: { id: string; ok: boolean; missing: string[] }[]
    }
    const translations = items.find(({ id }) => id === 'translations')
    expect(translations?.ok).toBe(false)
    expect(translations?.missing).toContain('title (ar)')
    expect(items.find(({ id }) => id === 'steps')?.ok).toBe(true)
  })

  it('reports an unknown contest', async () => {
    expect((await call(999_999_999, operator)).status).toBe(404)
  })
})
