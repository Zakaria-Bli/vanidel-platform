import type { UIFieldServerComponent } from 'payload'

import { wilayaLabel, wilayas } from '@/modules/audience/domain/wilayas'
import { drawTimeZone } from '@/modules/contests/domain/drawPeriod'
import type { Participation, Ticket } from '@/payload-types'

import { drawMessages } from './drawMessages'

const style = {
  box: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.5rem',
    marginBottom: '1.5rem',
    padding: '1rem',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: '4px',
  },
  details: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.35rem 1rem', margin: 0 },
  term: { color: 'var(--theme-elevation-500)' },
  receipt: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  image: {
    display: 'block',
    maxWidth: 'min(100%, 28rem)',
    maxHeight: '36rem',
    objectFit: 'contain',
    borderRadius: '4px',
    background: 'var(--theme-elevation-50)',
  },
} as const

/**
 * On a winner's page: the drawn participation as submitted, with its receipt photo, so staff can
 * verify the win before publishing (SPECIFICATION §9). The photo is served by Payload at
 * /api/tickets/file/*, which only answers logged-in staff.
 */
export const WinnerReceiptField: UIFieldServerComponent = async ({ data, payload, req, i18n }) => {
  const t = drawMessages(i18n.language)
  const reference = data?.participation as number | Participation | null | undefined
  const id = typeof reference === 'object' ? reference?.id : reference
  if (!id) return null

  const participation = await payload
    .findByID({ collection: 'participations', id, depth: 1, req, overrideAccess: false })
    .catch(() => null)
  if (!participation) return null

  const ticket = typeof participation.ticket === 'object' ? (participation.ticket as Ticket) : null
  const wilaya = wilayas.find(({ code }) => code === participation.wilaya)
  const submittedAt = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-DZ' : i18n.language, {
    timeZone: drawTimeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(participation.submittedAt))

  return (
    <section style={style.box} aria-label={t.verifyTitle}>
      <div>
        <h4>{t.verifyTitle}</h4>
        <p style={style.term}>{t.verifyHelp}</p>
        <dl style={style.details}>
          <dt style={style.term}>{t.entryName}</dt>
          <dd>{participation.name}</dd>
          <dt style={style.term}>{t.entryPhone}</dt>
          <dd dir="ltr">{participation.phone}</dd>
          <dt style={style.term}>{t.entryWilaya}</dt>
          <dd>
            {wilaya
              ? wilayaLabel(wilaya, i18n.language === 'ar' ? 'ar' : 'fr')
              : participation.wilaya}
          </dd>
          <dt style={style.term}>{t.entrySubmittedAt}</dt>
          <dd>{submittedAt}</dd>
        </dl>
      </div>
      <div style={style.receipt}>
        <strong>{t.receipt}</strong>
        {ticket?.url ? (
          <a href={ticket.url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element -- authenticated admin file, not optimizable */}
            <img src={ticket.url} alt={t.receipt} style={style.image} />
            <span>{t.openReceipt}</span>
          </a>
        ) : (
          <span>{t.noReceipt}</span>
        )}
      </div>
    </section>
  )
}
