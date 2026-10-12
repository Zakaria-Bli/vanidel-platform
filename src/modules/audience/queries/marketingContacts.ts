import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

export interface MarketingContact {
  contactId: number
  phone: string
  name: string
  email: string | null
  wilaya: string | null
  lastParticipationAt: string
  consentedAt: string
  consentTextVersion: string
}

/**
 * Contacts who may receive marketing (SPECIFICATION §7.1, §14): those whose most recent
 * `marketing` consent record is granted. A later refusal withdraws an earlier consent, and a later
 * consent restores it. Name, email and wilaya come from the contact's latest participation, not
 * from the first-seen values on the contact. Optionally limited to one contest's participants.
 */
export async function listMarketingContacts(
  payload: Payload,
  { contestId }: { contestId?: number } = {},
): Promise<MarketingContact[]> {
  const db = (payload.db as unknown as PostgresAdapter).drizzle
  const inContest =
    contestId === undefined
      ? sql``
      : sql`AND c.id IN (SELECT contact_id FROM participations WHERE contest_id = ${contestId})`

  const { rows } = await db.execute<Record<string, unknown>>(sql`
    WITH latest_consent AS (
      SELECT DISTINCT ON (contact_id) contact_id, granted, captured_at, text_version
      FROM consent_records
      WHERE type = 'marketing'
      ORDER BY contact_id, captured_at DESC, id DESC
    ),
    latest_participation AS (
      SELECT DISTINCT ON (contact_id) contact_id, name, email, wilaya, submitted_at
      FROM participations
      ORDER BY contact_id, submitted_at DESC, id DESC
    )
    SELECT c.id, c.phone_normalized, lp.name, lp.email, lp.wilaya, lp.submitted_at,
           lc.captured_at, lc.text_version
    FROM contacts c
    JOIN latest_consent lc ON lc.contact_id = c.id AND lc.granted
    JOIN latest_participation lp ON lp.contact_id = c.id
    WHERE TRUE ${inContest}
    ORDER BY c.id
  `)

  return rows.map((row) => ({
    contactId: Number(row.id),
    phone: String(row.phone_normalized),
    name: String(row.name),
    email: (row.email as string | null) || null,
    wilaya: (row.wilaya as string | null) || null,
    lastParticipationAt: new Date(row.submitted_at as string).toISOString(),
    consentedAt: new Date(row.captured_at as string).toISOString(),
    consentTextVersion: String(row.text_version),
  }))
}
