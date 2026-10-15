import Link from 'next/link'
import type { Payload } from 'payload'
import { formatAdminURL } from 'payload/shared'

import { defaultLocale } from '@/i18n/config'
import {
  participationCounts,
  type ParticipationCounts,
} from '@/modules/analytics/queries/participationCounts'
import { drawTimeZone } from '@/modules/contests/domain/drawPeriod'
import { contestPhase } from '@/modules/contests/domain/phase'
import type { ReadOptions } from '@/modules/contests/queries/pendingDraws'

import type { DashboardMessages } from './dashboardMessages'

export interface LiveContest {
  id: number
  title: string
  slug: string
  phase: 'open' | 'scheduled'
  /** Calendar days in Algiers until the last day (open) or the first day (scheduled). */
  days: number
  /** Null when the user may not read participations. */
  counts: ParticipationCounts | null
}

const dayMs = 24 * 60 * 60 * 1000
const algiersDay = new Intl.DateTimeFormat('sv-SE', { timeZone: drawTimeZone, dateStyle: 'short' })
const daysBetween = (from: Date, to: Date) =>
  Math.round((Date.parse(algiersDay.format(to)) - Date.parse(algiersDay.format(from))) / dayMs)

/** Published contests open now or coming up, soonest first, with their participation figures. */
export async function loadLiveContests(
  payload: Payload,
  options: ReadOptions,
  now: Date,
): Promise<LiveContest[]> {
  const { docs } = await payload.find({
    collection: 'contests',
    where: { status: { equals: 'published' }, endAt: { greater_than: now.toISOString() } },
    sort: 'startAt',
    limit: 12,
    depth: 0,
    select: { title: true, slug: true, status: true, startAt: true, endAt: true },
    ...options,
  })
  const counts = await participationCounts(
    payload,
    docs.map(({ id }) => id),
    options,
    now,
  )

  return docs.map((contest) => {
    const phase = contestPhase(contest, now) === 'open' ? 'open' : 'scheduled'
    return {
      id: contest.id,
      title: contest.title,
      slug: contest.slug,
      phase,
      // The end is exclusive, so an open contest's last day is the one before it.
      days:
        phase === 'open'
          ? daysBetween(now, new Date(new Date(contest.endAt).getTime() - 1))
          : daysBetween(now, new Date(contest.startAt)),
      counts: counts && (counts.get(contest.id) ?? { total: 0, today: 0, uniquePhones: 0 }),
    }
  })
}

function countdown(t: DashboardMessages['live'], { phase, days }: LiveContest): string {
  if (phase === 'open') {
    return days <= 0 ? t.endsToday : days === 1 ? t.endsTomorrow : t.endsIn(days)
  }
  return days <= 0 ? t.opensToday : days === 1 ? t.opensTomorrow : t.opensIn(days)
}

interface Props {
  contests: Promise<LiveContest[] | null>
  payload: Payload
  locale: ReadOptions['locale']
  t: DashboardMessages
}

/** "En direct": a card per open or coming contest, with its figures and links. */
export async function LiveContests({ contests, payload, locale = defaultLocale, t }: Props) {
  const loaded = await contests
  const { admin, api } = payload.config.routes
  const number = new Intl.NumberFormat(t.intlLocale)

  return (
    <section className="vd-dashboard__section" aria-labelledby="vd-dashboard-live">
      <h2 id="vd-dashboard-live" className="vd-dashboard__title">
        {t.live.title}
      </h2>
      {loaded === null && <p className="vd-dashboard__muted">{t.failed}</p>}
      {loaded?.length === 0 && <p className="vd-dashboard__muted">{t.live.none}</p>}
      {loaded && loaded.length > 0 && (
        <ul className="vd-dashboard__contests">
          {loaded.map((contest) => (
            <li key={contest.id} className="vd-dashboard__card">
              <div className="vd-dashboard__status">
                <span className={`vd-dashboard__badge vd-dashboard__badge--${contest.phase}`}>
                  {contest.phase === 'open' ? t.live.open : t.live.scheduled}
                </span>
                <span className="vd-dashboard__muted">{countdown(t.live, contest)}</span>
              </div>
              <h3 className="vd-dashboard__card-title">
                <bdi>{contest.title}</bdi>
              </h3>
              {contest.counts && (
                <dl className="vd-dashboard__figures">
                  {(
                    [
                      [t.live.participations, contest.counts.total],
                      [t.live.today, contest.counts.today],
                      [t.live.uniquePhones, contest.counts.uniquePhones],
                    ] as const
                  ).map(([name, value]) => (
                    <div key={name} className="vd-dashboard__figure">
                      <dt>{name}</dt>
                      <dd>{number.format(value)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="vd-dashboard__links">
                <Link
                  href={formatAdminURL({
                    adminRoute: admin,
                    path: `/collections/contests/${contest.id}`,
                  })}
                >
                  {t.live.edit}
                </Link>
                <a href={`/${locale}/concours/${contest.slug}`} target="_blank" rel="noopener">
                  {t.live.view}
                  <span className="sr-only"> {t.live.newTab}</span>
                </a>
                <a
                  href={`${formatAdminURL({ apiRoute: api, path: `/contests/${contest.id}/report` })}?format=csv`}
                >
                  {t.live.report}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function LiveContestsSkeleton({ t }: { t: DashboardMessages }) {
  return (
    <section className="vd-dashboard__section" aria-busy="true">
      <h2 className="vd-dashboard__title">{t.live.title}</h2>
      <p className="sr-only" role="status">
        {t.loading}
      </p>
      <div className="vd-dashboard__contests" aria-hidden>
        <div className="vd-dashboard__card vd-dashboard__skeleton" />
        <div className="vd-dashboard__card vd-dashboard__skeleton" />
      </div>
    </section>
  )
}
