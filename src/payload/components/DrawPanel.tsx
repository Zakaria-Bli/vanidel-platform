import type { Payload } from 'payload'
import type { I18nClient } from '@payloadcms/translations'

import { drawTimeZone } from '@/modules/contests/domain/drawPeriod'
import { endedDrawPeriods } from '@/modules/contests/queries/pendingDraws'

import { drawMessages, type DrawMessages } from './drawMessages'
import { RunDrawForm, type PeriodOption } from './RunDrawForm'

const dayMonth = new Intl.DateTimeFormat('fr-FR', {
  timeZone: drawTimeZone,
  day: '2-digit',
  month: '2-digit',
})

/** The ended periods as the form's options, read with full access: this list is staff-only. */
async function endedPeriods(payload: Payload, t: DrawMessages): Promise<PeriodOption[]> {
  return (await endedDrawPeriods(payload)).map(
    ({ contest, period: { index, start, end }, drawn }) => {
      // The end is exclusive: show the period's last day.
      const lastDay = dayMonth.format(new Date(end.getTime() - 1))
      return {
        value: `${contest.id}|${start.toISOString()}`,
        label: `${contest.title} · ${t.week} ${index + 1} (${dayMonth.format(start)} – ${lastDay})`,
        drawn,
      }
    },
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
