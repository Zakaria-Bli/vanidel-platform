import type { Payload } from 'payload'

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
  allLabel,
}: {
  contests: { id: number; title: string }[]
  allLabel: string
}) {
  return (
    <label style={style.field}>
      <span>Concours / Contest</span>
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

export async function ParticipationExport({ payload }: { payload: Payload }) {
  const contests = await contestOptions(payload)
  return (
    <form method="get" action="/api/participations/export" style={style.form}>
      <ContestSelect contests={contests} allLabel="Tous / All" />
      <label style={style.field}>
        <span>Du / From</span>
        <input type="date" name="from" />
      </label>
      <label style={style.field}>
        <span>Au / To</span>
        <input type="date" name="to" />
      </label>
      <button type="submit" className="btn btn--style-secondary btn--size-small">
        Exporter (CSV) / Export
      </button>
    </form>
  )
}

export async function MarketingContactsExport({ payload }: { payload: Payload }) {
  const contests = await contestOptions(payload)
  return (
    <form method="get" action="/api/contacts/export-marketing" style={style.form}>
      <ContestSelect contests={contests} allLabel="Tous les contacts / All contacts" />
      <button type="submit" className="btn btn--style-secondary btn--size-small">
        Exporter les contacts marketing (CSV) / Export marketing contacts
      </button>
    </form>
  )
}
