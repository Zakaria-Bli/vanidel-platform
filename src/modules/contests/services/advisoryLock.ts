import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

/** Serializes this transaction with any other holding the same key until it ends. */
export async function advisoryLock(payload: Payload, req: PayloadRequest, key: string) {
  const adapter = payload.db as unknown as PostgresAdapter
  const db = adapter.sessions[await req.transactionID!]?.db ?? adapter.drizzle
  await db.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${key}))`)
}
