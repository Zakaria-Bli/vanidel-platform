import { ChevronRight, CircleCheck } from 'lucide-react'
import Link from 'next/link'
import type { Payload } from 'payload'
import { Fragment, type ReactNode } from 'react'
import { formatAdminURL } from 'payload/shared'

import { incompleteDrafts, type IncompleteDraft } from '@/modules/contests/queries/incompleteDrafts'
import {
  pendingDraws,
  unpublishedWinners,
  type EndedPeriod,
  type ReadOptions,
  type UnpublishedWinner,
} from '@/modules/contests/queries/pendingDraws'

import { checklistMessages } from '../checklistMessages'
import type { DashboardMessages } from './dashboardMessages'

/** Each list is null when the user may not read what it is made of. */
export interface Todo {
  draws: EndedPeriod[] | null
  winners: UnpublishedWinner[] | null
  drafts: IncompleteDraft[] | null
}

/** What staff still have to do: draws to run, winners to publish, drafts to complete. */
export async function loadTodo(
  payload: Payload,
  options: ReadOptions,
  can: { contests: boolean; draws: boolean; winners: boolean },
  now: Date,
): Promise<Todo> {
  const [draws, winners, drafts] = await Promise.all([
    can.contests && can.draws ? pendingDraws(payload, options, now) : null,
    can.winners && can.contests ? unpublishedWinners(payload, options) : null,
    can.contests ? incompleteDrafts(payload, options) : null,
  ])
  return { draws, winners, drafts }
}

interface Item {
  key: string
  href: string
  label: ReactNode
  detail?: ReactNode
}

/** Names and titles isolated in `<bdi>`, so a French title keeps its punctuation in Arabic. */
function list(values: string[], separator: string): ReactNode {
  return values.map((value, index) => (
    <Fragment key={index}>
      {index > 0 && separator}
      <bdi>{value}</bdi>
    </Fragment>
  ))
}

interface Props {
  todo: Promise<Todo | null>
  payload: Payload
  language: string
  t: DashboardMessages
}

/** "À faire": one line per thing to do, each linking to where it is done. */
export async function TodoList({ todo, payload, language, t }: Props) {
  const loaded = await todo
  const adminURL = (path: `/${string}`) =>
    formatAdminURL({ adminRoute: payload.config.routes.admin, path })
  const checklist = checklistMessages(language)

  // The winners list, filtered as in its own filter menu.
  const winnersFilter = new URLSearchParams({
    'where[or][0][and][0][published][not_equals]': 'true',
    'where[or][0][and][1][voided][not_equals]': 'true',
  })
  const items: Item[] = loaded
    ? [
        ...(loaded.draws?.length
          ? [
              {
                key: 'draws',
                href: adminURL('/collections/draws'),
                label: t.todo.draws(loaded.draws.length),
                detail: list([...new Set(loaded.draws.map(({ contest }) => contest.title))], ' · '),
              },
            ]
          : []),
        ...(loaded.winners?.length
          ? [
              {
                key: 'winners',
                href: `${adminURL('/collections/winners')}?${winnersFilter}`,
                label: t.todo.winners(loaded.winners.length),
                detail: list(
                  loaded.winners.map(({ name }) => name),
                  t.comma,
                ),
              },
            ]
          : []),
        ...(loaded.drafts ?? []).map((draft) => ({
          key: `draft-${draft.id}`,
          href: adminURL(`/collections/contests/${draft.id}`),
          label: (
            <>
              {t.todo.draft}
              {t.colon}
              <bdi>{draft.title}</bdi>
            </>
          ),
          detail: draft.missing.map((id) => checklist.items[id]).join(' · '),
        })),
      ]
    : []

  return (
    <section className="vd-dashboard__section" aria-labelledby="vd-dashboard-todo">
      <h2 id="vd-dashboard-todo" className="vd-dashboard__title">
        {t.todo.title}
      </h2>
      {loaded === null && <p className="vd-dashboard__muted">{t.failed}</p>}
      {loaded && items.length === 0 && (
        <p className="vd-dashboard__done">
          <CircleCheck aria-hidden size={18} />
          {t.todo.none}
        </p>
      )}
      {items.length > 0 && (
        <ul className="vd-dashboard__todo">
          {items.map((item) => (
            <li key={item.key}>
              <Link href={item.href} className="vd-dashboard__todo-link">
                <span>
                  <span className="vd-dashboard__todo-label">{item.label}</span>
                  {item.detail && <span className="vd-dashboard__muted">{item.detail}</span>}
                </span>
                <ChevronRight aria-hidden size={18} className="vd-dashboard__chevron" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function TodoListSkeleton({ t }: { t: DashboardMessages }) {
  return (
    <section className="vd-dashboard__section" aria-busy="true">
      <h2 className="vd-dashboard__title">{t.todo.title}</h2>
      <p className="sr-only" role="status">
        {t.loading}
      </p>
      <div className="vd-dashboard__todo" aria-hidden>
        <div className="vd-dashboard__skeleton vd-dashboard__skeleton--line" />
        <div className="vd-dashboard__skeleton vd-dashboard__skeleton--line" />
      </div>
    </section>
  )
}
