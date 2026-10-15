import type { CollectionSlug, Payload, ServerProps } from 'payload'
import { Suspense } from 'react'

import { BrandMark, Slogan } from '@/components/shared/BrandLogo'
import { defaultLocale, locales } from '@/i18n/config'
import { drawTimeZone } from '@/modules/contests/domain/drawPeriod'
import type { ReadOptions } from '@/modules/contests/queries/pendingDraws'
import type { User } from '@/payload-types'

import { dashboardMessages } from './dashboardMessages'
import { LiveContests, LiveContestsSkeleton, loadLiveContests } from './LiveContests'
import { QuickActions } from './QuickActions'
import { loadTodo, TodoList, TodoListSkeleton } from './TodoList'

import './dashboard.scss'

/** A section's data, or null once the failure is logged: the dashboard never blocks the admin. */
async function orNull<T>(payload: Payload, load: () => Promise<T>): Promise<T | null> {
  try {
    return await load()
  } catch (error) {
    payload.logger.error({ err: error, msg: 'Dashboard section failed to load' })
    return null
  }
}

/**
 * The admin home, above Payload's collection cards (kept, so new collections still appear): a
 * welcome band, the open and coming contests with their figures, what is left to do, and shortcuts.
 * Everything is read through the Local API as the signed-in user (`overrideAccess: false`) and
 * shown only where their permissions allow, so nobody sees more than they could open. The figures
 * stream in behind skeletons, so the page paints at once.
 */
export function VanidelDashboard({ i18n, locale, payload, permissions, user }: ServerProps) {
  const t = dashboardMessages(i18n.language)
  const now = new Date()
  const can = (slug: CollectionSlug, operation: 'read' | 'create' = 'read') =>
    Boolean(permissions?.collections?.[slug]?.[operation])
  const options: ReadOptions = {
    user: (user as User | undefined) ?? null,
    overrideAccess: false,
    // Contest titles in the content language picked in the admin, as in its lists.
    locale: locales.find((code) => code === locale?.code) ?? defaultLocale,
  }

  // Started here, in parallel; each section waits for its own data behind its skeleton.
  const live = can('contests')
    ? orNull(payload, () => loadLiveContests(payload, options, now))
    : null
  const todo = orNull(payload, () =>
    loadTodo(
      payload,
      options,
      { contests: can('contests'), draws: can('draws'), winners: can('winners') },
      now,
    ),
  )
  const today = new Intl.DateTimeFormat(t.intlLocale, {
    timeZone: drawTimeZone,
    dateStyle: 'full',
  }).format(now)

  return (
    <div className="vd-dashboard">
      <header className="vd-dashboard__welcome">
        <div>
          <h1 className="vd-dashboard__hello">
            {t.hello((user as User | undefined)?.name || null)}
          </h1>
          <p>{today}</p>
        </div>
        <div className="vd-dashboard__art">
          <Slogan tone="white" className="vd-dashboard__slogan" />
          <BrandMark tone="white" className="vd-dashboard__mark" />
        </div>
      </header>
      <div className="vd-dashboard__grid">
        {live && (
          <Suspense fallback={<LiveContestsSkeleton t={t} />}>
            <LiveContests contests={live} payload={payload} locale={options.locale} t={t} />
          </Suspense>
        )}
        <Suspense fallback={<TodoListSkeleton t={t} />}>
          <TodoList todo={todo} payload={payload} language={i18n.language} t={t} />
        </Suspense>
      </div>
      <QuickActions
        payload={payload}
        can={{
          createContest: can('contests', 'create'),
          createCampaignLink: can('campaign-links', 'create'),
          participations: can('participations'),
          media: can('media'),
        }}
        t={t}
      />
    </div>
  )
}
