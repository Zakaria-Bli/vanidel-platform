import type { MigrateDownArgs, MigrateUpArgs, PostgresAdapter } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { migrations } from '@/migrations'

import { getMigratedPayload } from './helpers/payload'

let payload: Payload

beforeAll(async () => {
  payload = await getMigratedPayload()
}, 30_000)

afterAll(async () => {
  await payload?.destroy()
})

class Undo extends Error {}

describe('migrations', () => {
  // Rolled back inside a transaction, so the shared test database keeps its schema.
  it.each(migrations.filter(({ name }) => name >= '20261014_110120').map(({ name }) => name))(
    '%s rolls back and reapplies',
    async (name) => {
      const migration = migrations.find((entry) => entry.name === name)!
      const db = (payload.db as unknown as PostgresAdapter).drizzle
      await expect(
        db.transaction(async (tx) => {
          const args = { db: tx, payload, req: {} }
          await migration.down(args as unknown as MigrateDownArgs)
          await migration.up(args as unknown as MigrateUpArgs)
          throw new Undo()
        }),
      ).rejects.toBeInstanceOf(Undo)
    },
  )
})
