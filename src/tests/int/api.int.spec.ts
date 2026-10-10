import { postgresAdapter, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { env } from '@/lib/env'
import { migrations } from '@/migrations'

import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload

// Use the same bundled registry as production. Payload's generic migration API
// accepts unknown arguments; the PostgreSQL adapter supplies its typed arguments.
const testMigrations = migrations.map(({ name, up, down }) => ({
  name,
  up: (args: unknown) => up(args as MigrateUpArgs),
  down: (args: unknown) => down(args as MigrateDownArgs),
}))

describe('Payload with committed PostgreSQL migrations', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({
      config: {
        ...payloadConfig,
        db: {
          ...postgresAdapter({
            pool: { connectionString: env.DATABASE_URL },
            migrationDir: resolve(import.meta.dirname, '../../migrations'),
            disableCreateDatabase: true,
            push: false,
          }),
          allowIDOnCreate: payloadConfig.db.allowIDOnCreate,
          name: payloadConfig.db.name,
        },
      },
    })

    // Refuse schema-push databases before Payload can prompt to replace their data.
    const { rows } = await payload.db.pool.query(
      "SELECT to_regclass('public.payload_migrations') AS table_name",
    )
    if (rows[0].table_name) {
      const pushed = await payload.find({
        collection: 'payload-migrations',
        where: { batch: { equals: -1 } },
        limit: 1,
      })
      if (pushed.totalDocs > 0) {
        throw new Error(
          'Use a fresh test database: this database was initialized with schema push.',
        )
      }
    }

    await payload.db.migrate({ migrations: testMigrations })
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
      data: { email, password: randomUUID() },
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
