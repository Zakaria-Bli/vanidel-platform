import type { Payload } from 'payload'
import type { I18nClient } from '@payloadcms/translations'

import { drawPeriodsOf, drawTimeZone } from '@/modules/contests/domain/drawPeriod'

import { drawMessages, type DrawMessages } from './drawMessages'
import { RunDrawForm, type PeriodOption } from './RunDrawForm'

const dayMonth = new Intl.DateTimeFormat('fr-FR', {
  timeZone: drawTimeZone,
  day: '2-digit',
  month: '2-digit',
})

/** Every ended period of every non-draft contest, newest contest first. */
async function endedPeriods(payload: Payload, t: DrawMessages): Promise<PeriodOption[]> {
  const now = Date.now()

  const { docs: contests } = await payload.find({
    collection: 'contests',
    where: { status: { not_equals: 'draft' } },
    sort: '-startAt',
    limit: 100,
    depth: 0,
    select: { title: true, startAt: true, endAt: true, draw: true },
  })
  const { docs: draws } = await payload.find({
    collection: 'draws',
    where: { contest: { in: contests.map(({ id }) => id) } },
    pagination: false,
    depth: 0,
    select: { contest: true, periodStart: true },
  })
  const drawn = new Set(
    draws.map(({ contest, periodStart }) => {
      const id = typeof contest === 'object' ? contest.id : contest
      return `${id}|${new Date(periodStart).toISOString()}`
    }),
  )

  return contests.flatMap((contest) =>
    drawPeriodsOf(contest)
      .filter(({ end }) => end.getTime() <= now)
      .map(({ index, start, end }) => {
        const value = `${contest.id}|${start.toISOString()}`
        // The end is exclusive: show the period's last day.
        const lastDay = dayMonth.format(new Date(end.getTime() - 1))
        return {
          value,
          label: `${contest.title} · ${t.week} ${index + 1} (${dayMonth.format(start)} – ${lastDay})`,
          drawn: drawn.has(value),
        }
      }),
  )
}

/**
 * Above the draws list: the ended periods, with the ones already drawn disabled. The draw itself
 * runs through POST /api/draws/run, which checks everything again.
 */
export async function DrawPanel({ payload, i18n }: { payload: Payload; i18n: I18nClient }) {
  const t = drawMessages(i18n.language)
  return <RunDrawForm options={await endedPeriods(payload, t)} t={t} />
}
