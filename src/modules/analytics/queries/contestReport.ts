import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

import { listMarketingContacts } from '@/modules/audience/queries/marketingContacts'

import { campaignLinkTags, type CampaignChannel } from '../domain/campaignLinks'

export interface ChannelRow {
  /** Null for entries that arrived without any campaign tag (typed address, search…). */
  source: string | null
  medium: string | null
  content: string | null
  /** Names of the campaign links carrying exactly these tags. */
  links: string[]
  participations: number
  uniquePhones: number
}

export interface ContestReport {
  contest: { id: number; title: string; slug: string; startAt: string; endAt: string }
  totals: {
    participations: number
    uniquePhones: number
    /** Participants whose current marketing consent is granted. */
    marketingOptIns: number
  }
  /** Most entries first; links that brought none yet are listed too, with zero. */
  channels: ChannelRow[]
  wilayas: { code: string | null; participations: number }[]
  /** Entries per draw period, by the period start recorded on submission. */
  periods: { periodStart: string; participations: number }[]
  draws: { draws: number; redraws: number; winners: number; published: number; voided: number }
}

const key = (source: string | null, medium: string | null, content: string | null) =>
  JSON.stringify([source, medium, content])

/**
 * The per-contest report (SPECIFICATION §13.3): entries by channel, wilaya and period, and the
 * draws. Visits come from the analytics tools, not from here. Null when the contest is unknown.
 */
export async function contestReport(
  payload: Payload,
  contestId: number,
): Promise<ContestReport | null> {
  const contest = await payload
    .findByID({ collection: 'contests', id: contestId, depth: 0 })
    .catch(() => null)
  if (!contest) return null
  const db = (payload.db as unknown as PostgresAdapter).drizzle

  const [totals, channels, wilayas, periods, draws, links, optIns] = await Promise.all([
    db.execute<{ participations: string; unique_phones: string }>(sql`
      SELECT count(*) AS participations, count(DISTINCT contact_id) AS unique_phones
      FROM participations WHERE contest_id = ${contestId} AND deleted_at IS NULL
    `),
    db.execute<{
      source: string | null
      medium: string | null
      content: string | null
      participations: string
      unique_phones: string
    }>(sql`
      SELECT NULLIF(source, '') AS source, NULLIF(utm_medium, '') AS medium,
             NULLIF(utm_content, '') AS content,
             count(*) AS participations, count(DISTINCT contact_id) AS unique_phones
      FROM participations WHERE contest_id = ${contestId} AND deleted_at IS NULL
      GROUP BY 1, 2, 3
    `),
    db.execute<{ code: string | null; participations: string }>(sql`
      SELECT NULLIF(wilaya, '') AS code, count(*) AS participations
      FROM participations WHERE contest_id = ${contestId} AND deleted_at IS NULL
      GROUP BY 1 ORDER BY 2 DESC, 1
    `),
    db.execute<{ period_start: string | Date; participations: string }>(sql`
      SELECT period_start, count(*) AS participations
      FROM participations WHERE contest_id = ${contestId} AND deleted_at IS NULL
      GROUP BY 1 ORDER BY 1
    `),
    db.execute<Record<'draws' | 'redraws' | 'winners' | 'published' | 'voided', string>>(sql`
      SELECT count(DISTINCT d.id) AS draws,
             count(DISTINCT d.id) FILTER (WHERE d.redraw_of_id IS NOT NULL) AS redraws,
             count(w.id) AS winners,
             count(w.id) FILTER (WHERE w.published AND NOT coalesce(w.voided, false)) AS published,
             count(w.id) FILTER (WHERE w.voided) AS voided
      FROM draws d LEFT JOIN winners w ON w.draw_id = d.id
      WHERE d.contest_id = ${contestId}
    `),
    payload.find({
      collection: 'campaign-links',
      where: { contest: { equals: contestId } },
      select: { name: true, channel: true, code: true },
      pagination: false,
      depth: 0,
    }),
    listMarketingContacts(payload, { contestId }),
  ])

  const rows = new Map<string, ChannelRow>()
  for (const row of channels.rows) {
    rows.set(key(row.source, row.medium, row.content), {
      source: row.source,
      medium: row.medium,
      content: row.content,
      links: [],
      participations: Number(row.participations),
      uniquePhones: Number(row.unique_phones),
    })
  }
  for (const link of links.docs) {
    const tags = campaignLinkTags({
      channel: link.channel as CampaignChannel,
      code: link.code,
    })
    const rowKey = key(tags.source, tags.medium, tags.content ?? null)
    const row = rows.get(rowKey) ?? {
      source: tags.source,
      medium: tags.medium,
      content: tags.content ?? null,
      links: [],
      participations: 0,
      uniquePhones: 0,
    }
    row.links.push(link.name)
    rows.set(rowKey, row)
  }

  const count = (value: string | undefined) => Number(value ?? 0)
  const drawRow = draws.rows[0]

  return {
    contest: {
      id: contest.id,
      title: contest.title,
      slug: contest.slug,
      startAt: contest.startAt,
      endAt: contest.endAt,
    },
    totals: {
      participations: count(totals.rows[0]?.participations),
      uniquePhones: count(totals.rows[0]?.unique_phones),
      marketingOptIns: optIns.length,
    },
    channels: [...rows.values()].sort(
      (a, b) =>
        b.participations - a.participations ||
        (a.source ?? '').localeCompare(b.source ?? '') ||
        (a.content ?? '').localeCompare(b.content ?? ''),
    ),
    wilayas: wilayas.rows.map((row) => ({
      code: row.code,
      participations: Number(row.participations),
    })),
    periods: periods.rows.map((row) => ({
      periodStart: new Date(row.period_start).toISOString(),
      participations: Number(row.participations),
    })),
    draws: {
      draws: count(drawRow?.draws),
      redraws: count(drawRow?.redraws),
      winners: count(drawRow?.winners),
      published: count(drawRow?.published),
      voided: count(drawRow?.voided),
    },
  }
}
