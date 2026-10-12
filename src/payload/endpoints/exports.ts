import type { Endpoint, PayloadRequest, Where } from 'payload'

import { csvResponse, toCsv } from '@/lib/csv'
import { wilayas } from '@/modules/audience/domain/wilayas'
import { listMarketingContacts } from '@/modules/audience/queries/marketingContacts'
import { drawTimeZone, startOfAlgiersDay } from '@/modules/contests/domain/drawPeriod'

import { hasRole } from '../access'

const forbidden = () => Response.json({ errors: [{ message: 'Forbidden' }] }, { status: 403 })

/** "2026-10-15 14:05" in Algiers time, which spreadsheets sort and read correctly. */
const algiersTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: drawTimeZone,
  dateStyle: 'short',
  timeStyle: 'short',
})
const localTime = (value: string | null | undefined) =>
  value ? algiersTime.format(new Date(value)) : ''

const wilayaName = (code: string | null | undefined) =>
  wilayas.find((wilaya) => wilaya.code === code)?.fr ?? ''

const today = () => new Date().toISOString().slice(0, 10)

function contestFilter(req: PayloadRequest): number | undefined | null {
  const raw = req.searchParams.get('contest')
  if (!raw) return undefined
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * GET /api/participations/export?contest={id}&from={YYYY-MM-DD}&to={YYYY-MM-DD}: the
 * participation list as submitted, for staff. Dates are Algiers calendar days, both inclusive;
 * every filter is optional.
 */
export const exportParticipations: Omit<Endpoint, 'root'> = {
  path: '/export',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req, 'admin', 'commercial')) return forbidden()

    const contestId = contestFilter(req)
    const from = req.searchParams.get('from')
    const to = req.searchParams.get('to')
    const start = from ? startOfAlgiersDay(from) : undefined
    const lastDay = to ? startOfAlgiersDay(to) : undefined
    if (contestId === null || start === null || lastDay === null) {
      return Response.json({ errors: [{ message: 'Invalid filter' }] }, { status: 400 })
    }

    const where: Where = {}
    if (contestId) where.contest = { equals: contestId }
    if (start || lastDay) {
      where.submittedAt = {
        ...(start && { greater_than_equal: start.toISOString() }),
        // The whole last day: until the next day's midnight.
        ...(lastDay && { less_than: new Date(lastDay.getTime() + 24 * 3600 * 1000).toISOString() }),
      }
    }

    const { docs } = await req.payload.find({
      collection: 'participations',
      where,
      sort: 'submittedAt',
      pagination: false,
      depth: 1,
      req,
    })

    const csv = toCsv(
      [
        'submitted_at',
        'period_start',
        'contest',
        'name',
        'phone',
        'phone_normalized',
        'email',
        'wilaya_code',
        'wilaya',
        'language',
        'source',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'ticket',
      ],
      docs.map((doc) => [
        localTime(doc.submittedAt),
        localTime(doc.periodStart),
        typeof doc.contest === 'object' ? doc.contest.slug : doc.contest,
        doc.name,
        doc.phone,
        doc.phoneNormalized,
        doc.email,
        doc.wilaya,
        wilayaName(doc.wilaya),
        doc.locale,
        doc.source,
        doc.utmSource,
        doc.utmMedium,
        doc.utmCampaign,
        doc.utmContent,
        typeof doc.ticket === 'object' ? doc.ticket.filename : doc.ticket,
      ]),
    )
    return csvResponse(csv, `participations-${contestId ?? 'all'}-${today()}.csv`)
  },
}

/**
 * GET /api/contacts/export-marketing?contest={id}: contacts whose latest marketing consent is
 * granted, with their latest submitted details. Optionally only one contest's participants.
 */
export const exportMarketingContacts: Omit<Endpoint, 'root'> = {
  path: '/export-marketing',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req, 'admin', 'commercial')) return forbidden()

    const contestId = contestFilter(req)
    if (contestId === null) {
      return Response.json({ errors: [{ message: 'Invalid filter' }] }, { status: 400 })
    }

    const contacts = await listMarketingContacts(req.payload, { contestId })
    const csv = toCsv(
      [
        'phone',
        'name',
        'email',
        'wilaya_code',
        'wilaya',
        'last_participation_at',
        'consented_at',
        'consent_text_version',
      ],
      contacts.map((contact) => [
        contact.phone,
        contact.name,
        contact.email,
        contact.wilaya,
        wilayaName(contact.wilaya),
        localTime(contact.lastParticipationAt),
        localTime(contact.consentedAt),
        contact.consentTextVersion,
      ]),
    )
    return csvResponse(csv, `marketing-contacts-${contestId ?? 'all'}-${today()}.csv`)
  },
}
