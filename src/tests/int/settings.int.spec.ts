import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

import { createUser, getMigratedPayload } from './helpers/payload'

let payload: Payload
let commercial: User

beforeAll(async () => {
  payload = await getMigratedPayload()
  commercial = await createUser(payload, 'commercial')
  await payload.updateGlobal({
    slug: 'settings',
    data: { ga4Id: 'G-TEST123', retentionDays: 365 },
  })
}, 30_000)

afterAll(async () => {
  if (commercial) await payload?.delete({ collection: 'users', id: commercial.id })
  await payload?.destroy()
})

describe('settings', () => {
  it('exposes tracking IDs publicly but keeps the retention period internal', async () => {
    const settings = await payload.findGlobal({ slug: 'settings', overrideAccess: false })

    expect(settings.ga4Id).toBe('G-TEST123')
    expect(settings.retentionDays).toBeUndefined()
  })

  it('shows the retention period to staff', async () => {
    const settings = await payload.findGlobal({
      slug: 'settings',
      user: commercial,
      overrideAccess: false,
    })
    expect(settings.retentionDays).toBe(365)
  })

  it('lets only admins change settings', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'settings',
        data: { ga4Id: 'G-OTHER' },
        user: commercial,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('requires a whole number of retention days', async () => {
    await expect(
      payload.updateGlobal({ slug: 'settings', data: { retentionDays: 30.5 } }),
    ).rejects.toThrow()
  })

  it('validates the tracking IDs', async () => {
    await expect(
      payload.updateGlobal({ slug: 'settings', data: { ga4Id: 'UA-123' } }),
    ).rejects.toThrow()
  })
})
