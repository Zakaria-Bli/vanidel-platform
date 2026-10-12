import { postgresAdapter, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { getPayload, type Payload } from 'payload'

import { env } from '@/lib/env'
import { migrations } from '@/migrations'
import type { User } from '@/payload-types'
import config from '@/payload.config'

// Use the same bundled registry as production. Payload's generic migration API
// accepts unknown arguments; the PostgreSQL adapter supplies its typed arguments.
export const testMigrations = migrations.map(({ name, up, down }) => ({
  name,
  up: (args: unknown) => up(args as MigrateUpArgs),
  down: (args: unknown) => down(args as MigrateDownArgs),
}))

/**
 * Payload on the test database with every committed migration applied, so tests exercise the
 * schema production gets rather than a schema push.
 */
export async function getMigratedPayload(): Promise<Payload> {
  const payloadConfig = await config
  const payload = await getPayload({
    config: {
      ...payloadConfig,
      db: {
        ...postgresAdapter({
          pool: { connectionString: env.DATABASE_URL },
          migrationDir: resolve(import.meta.dirname, '../../../migrations'),
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
      throw new Error('Use a fresh test database: this database was initialized with schema push.')
    }
  }

  await payload.db.migrate({ migrations: testMigrations })
  return payload
}

/** Creates a throwaway back-office user; `user` is what Local API calls take to act as them. */
export async function createUser(payload: Payload, role: User['role']): Promise<User> {
  return payload.create({
    collection: 'users',
    data: { email: `${role}-${randomUUID()}@example.com`, password: randomUUID(), role },
  })
}
