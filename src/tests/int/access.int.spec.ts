import { randomUUID } from 'node:crypto'
import type { Payload, PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'
import { firstUserIsAdmin } from '@/payload/collections/Users'

import { createUser, getMigratedPayload } from './helpers/payload'

let payload: Payload
let admin: User
let commercial: User

beforeAll(async () => {
  payload = await getMigratedPayload()
  admin = await createUser(payload, 'admin')
  commercial = await createUser(payload, 'commercial')
}, 30_000)

afterAll(async () => {
  await payload?.delete({
    collection: 'users',
    where: { id: { in: [admin?.id, commercial?.id].filter(Boolean) } },
  })
  await payload?.destroy()
})

describe('users', () => {
  const newUser = (role: User['role']) => ({
    email: `new-${randomUUID()}@example.com`,
    password: randomUUID(),
    role,
  })

  it('lets an admin create a user with a role', async () => {
    const created = await payload.create({
      collection: 'users',
      data: newUser('admin'),
      user: admin,
      overrideAccess: false,
    })

    expect(created.role).toBe('admin')
    await payload.delete({ collection: 'users', id: created.id })
  })

  it('refuses user creation by a commercial user', async () => {
    await expect(
      payload.create({
        collection: 'users',
        data: newUser('commercial'),
        user: commercial,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('ignores a commercial user changing their own role', async () => {
    const updated = await payload.update({
      collection: 'users',
      id: commercial.id,
      data: { role: 'admin', name: 'Renamed' },
      user: commercial,
      overrideAccess: false,
    })

    expect(updated.name).toBe('Renamed')
    expect(updated.role).toBe('commercial')
  })

  it('refuses a commercial user editing someone else', async () => {
    await expect(
      payload.update({
        collection: 'users',
        id: admin.id,
        data: { name: 'Hijacked' },
        user: commercial,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('hides users from anonymous requests', async () => {
    await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toThrow()
  })

  it('makes the very first user an admin', async () => {
    const req = (count: number) =>
      ({ payload: { count: async () => ({ totalDocs: count }) } }) as unknown as PayloadRequest
    const run = (count: number) =>
      firstUserIsAdmin({
        data: { role: 'commercial' },
        operation: 'create',
        req: req(count),
      } as unknown as Parameters<typeof firstUserIsAdmin>[0])

    expect(await run(0)).toMatchObject({ role: 'admin' })
    expect(await run(1)).toMatchObject({ role: 'commercial' })
  })
})
