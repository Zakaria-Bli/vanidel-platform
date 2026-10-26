import type { I18nClient } from '@payloadcms/translations'
import type { Payload } from 'payload'

import { reportMessages } from './reportMessages'

// Download forms above the participations and contacts lists. A plain GET form: the browser
// downloads the CSV with the staff session cookie, and the endpoints check the role again.

const style = {
  form: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'end',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
} as const

async function contestOptions(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'contests',
    sort: '-startAt',
    limit: 100,
    depth: 0,
    select: { title: true },
  })
  return docs
}

function ContestSelect({
  contests,
  label,
  allLabel,
}: {
  contests: { id: number; title: string }[]
  label: string
  allLabel: string
}) {
  return (
    <label style={style.field}>
      <span>{label}</span>
      <select name="contest" defaultValue="">
        <option value="">{allLabel}</option>
        {contests.map((contest) => (
          <option key={contest.id} value={contest.id}>
            {contest.title}
          </option>
        ))}
      </select>
    </label>
  )
}

type ExportProps = { payload: Payload; i18n: I18nClient }

export async function ParticipationExport({ payload, i18n }: ExportProps) {
  const t = reportMessages(i18n.language).exports
  const contests = await contestOptions(payload)
  return (
    <form method="get" action="/api/participations/export" style={style.form}>
      <ContestSelect contests={contests} label={t.contest} allLabel={t.all} />
      <label style={style.field}>
        <span>{t.from}</span>
        <input type="date" name="from" />
      </label>
      <label style={style.field}>
        <span>{t.to}</span>
        <input type="date" name="to" />
      </label>
      <button type="submit" className="btn btn--style-secondary btn--size-small">
        {t.participations}
      </button>
    </form>
  )
}

export async function MarketingContactsExport({ payload, i18n }: ExportProps) {
  const t = reportMessages(i18n.language).exports
  const contests = await contestOptions(payload)
  return (
    <form method="get" action="/api/contacts/export-marketing" style={style.form}>
      <ContestSelect contests={contests} label={t.contest} allLabel={t.allContacts} />
      <button type="submit" className="btn btn--style-secondary btn--size-small">
        {t.marketingContacts}
      </button>
    </form>
  )
}
