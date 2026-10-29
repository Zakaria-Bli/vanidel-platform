import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import { Forbidden, type Payload } from 'payload'

import { drawTimeZone, startOfAlgiersDay } from '@/modules/contests/domain/drawPeriod'
import type { ReadOptions } from '@/modules/contests/queries/pendingDraws'

export interface ParticipationCounts {
  total: number
  /** Since midnight today, Algiers time. */
  today: number
  uniquePhones: number
}

/** "2026-10-15": the calendar day in Algiers. */
const algiersDay = new Intl.DateTimeFormat('sv-SE', { timeZone: drawTimeZone, dateStyle: 'short' })

/**
 * Participations per contest, for the dashboard: in total, today (Algiers calendar day) and from how
 * many phones. Contests without any are left out. Null when `options` may not read participations.
 */
export async function participationCounts(
  payload: Payload,
  contestIds: number[],
  { user, overrideAccess }: ReadOptions = {},
  now: Date = new Date(),
): Promise<Map<number, ParticipationCounts> | null> {
  if (contestIds.length === 0) return new Map()
  // Whether the user may read participations is asked through the Local API, so the collection's
  // own rule decides. That rule is all or nothing (staff only); unique phones cannot be counted
  // through the Local API, so the figures themselves come from one grouped query.
  try {
    await payload.count({
      collection: 'participations',
      where: { contest: { in: contestIds } },
      user,
      overrideAccess,
    })
  } catch (error) {
    if (error instanceof Forbidden) return null
    throw error
  }

  const startOfToday = startOfAlgiersDay(algiersDay.format(now))!
  const db = (payload.db as unknown as PostgresAdapter).drizzle
  const { rows } = await db.execute<{
    contest_id: number
    total: string
    today: string
    unique_phones: string
  }>(sql`
    SELECT contest_id, count(*) AS total,
           count(*) FILTER (WHERE submitted_at >= ${startOfToday.toISOString()}) AS today,
           count(DISTINCT contact_id) AS unique_phones
    FROM participations
    WHERE deleted_at IS NULL AND contest_id IN (${sql.join(
      contestIds.map((id) => sql`${id}`),
      sql`, `,
    )})
    GROUP BY contest_id
  `)

  return new Map(
    rows.map((row) => [
      Number(row.contest_id),
      {
        total: Number(row.total),
        today: Number(row.today),
        uniquePhones: Number(row.unique_phones),
      },
    ]),
  )
}
