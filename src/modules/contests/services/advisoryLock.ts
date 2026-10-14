import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

/**
 * Serializes this transaction with any other holding the same key until it ends. A `shared` lock
 * only waits for, and blocks, exclusive holders of the key.
 */
export async function advisoryLock(
  payload: Payload,
  req: PayloadRequest,
  key: string,
  { shared = false }: { shared?: boolean } = {},
) {
  const adapter = payload.db as unknown as PostgresAdapter
  const db = adapter.sessions[await req.transactionID!]?.db ?? adapter.drizzle
  await db.execute(
    shared
      ? sql`SELECT pg_advisory_xact_lock_shared(hashtext(${key}))`
      : sql`SELECT pg_advisory_xact_lock(hashtext(${key}))`,
  )
}

/**
 * Held shared by every submission and exclusively by draws, so a draw reads its pool only once the
 * submissions already being saved are committed, and none is saved while it runs.
 */
export const contestDrawLock = (contestId: number) => `draw:contest:${contestId}`

/** Held while a duplicated contest picks its slug, until the copy is saved. */
export const contestSlugLock = 'contests:slug'
