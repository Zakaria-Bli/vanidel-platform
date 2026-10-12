import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  getPublicContest,
  listCurrentContests,
  listPastContests,
} from '@/modules/contests/queries/publicContests'
import type { Contest } from '@/payload-types'

import { createDraftContest, createPublishedContest } from './helpers/contests'
import { getMigratedPayload } from './helpers/payload'

const day = 24 * 60 * 60 * 1000

let payload: Payload
let draft: Contest
let open: Contest
let ended: Contest
let archived: Contest

beforeAll(async () => {
  payload = await getMigratedPayload()
  draft = await createDraftContest(payload)
  open = await createPublishedContest(payload)
  ended = await createPublishedContest(payload)
  ended = await payload.update({
    collection: 'contests',
    id: ended.id,
    data: {
      startAt: new Date(Date.now() - 30 * day).toISOString(),
      endAt: new Date(Date.now() - day).toISOString(),
    },
  })
  archived = await createPublishedContest(payload)
  archived = await payload.update({
    collection: 'contests',
    id: archived.id,
    data: { status: 'archived' },
  })
}, 30_000)

afterAll(async () => {
  const ids = [draft, open, ended, archived].filter(Boolean).map(({ id }) => id)
  if (ids.length > 0) await payload?.delete({ collection: 'contests', where: { id: { in: ids } } })
  await payload?.destroy()
})

const ids = (contests: Contest[]) => contests.map(({ id }) => id)

describe('public contest queries', () => {
  it('finds a published contest by slug in the requested language', async () => {
    const contest = await getPublicContest(payload, open.slug, 'ar')
    expect(contest?.title).toBe('المسابقة الكبرى')
  })

  it('never returns a draft', async () => {
    expect(await getPublicContest(payload, draft.slug, 'fr')).toBeNull()
    expect(ids(await listCurrentContests(payload, 'fr'))).not.toContain(draft.id)
    expect(ids(await listPastContests(payload, 'fr'))).not.toContain(draft.id)
  })

  it('lists open contests as current', async () => {
    const current = ids(await listCurrentContests(payload, 'fr'))
    expect(current).toContain(open.id)
    expect(current).not.toContain(ended.id)
    expect(current).not.toContain(archived.id)
  })

  it('lists ended and archived contests as past', async () => {
    const past = ids(await listPastContests(payload, 'fr'))
    expect(past).toContain(ended.id)
    expect(past).toContain(archived.id)
    expect(past).not.toContain(open.id)
  })
})
