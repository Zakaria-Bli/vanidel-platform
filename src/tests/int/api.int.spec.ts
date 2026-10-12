import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { migrations } from '@/migrations'

import { getMigratedPayload, testMigrations } from './helpers/payload'

let payload: Payload

describe('Payload with committed PostgreSQL migrations', () => {
  beforeAll(async () => {
    payload = await getMigratedPayload()
  }, 30_000)

  afterAll(async () => {
    await payload?.destroy()
  })

  it('records every committed migration and skips them on a second run', async () => {
    const before = await payload.find({ collection: 'payload-migrations', pagination: false })
    expect(before.docs.map(({ name }) => name).sort()).toEqual(
      migrations.map(({ name }) => name).sort(),
    )
    expect(before.docs.every(({ batch }) => typeof batch === 'number' && batch > 0)).toBe(true)

    await payload.db.migrate({ migrations: testMigrations })
    const after = await payload.find({ collection: 'payload-migrations', pagination: false })
    expect(after.docs).toEqual(before.docs)
  })

  it('creates, reads, and deletes a user through the migrated schema', async () => {
    const email = `migration-${randomUUID()}@example.com`
    const user = await payload.create({
      collection: 'users',
      data: { email, password: randomUUID(), role: 'commercial' },
    })

    try {
      const stored = await payload.findByID({ collection: 'users', id: user.id })
      expect(stored.email).toBe(email)
    } finally {
      await payload.delete({ collection: 'users', id: user.id })
    }

    const remaining = await payload.find({
      collection: 'users',
      where: { id: { equals: user.id } },
    })
    expect(remaining.totalDocs).toBe(0)
  })
})
