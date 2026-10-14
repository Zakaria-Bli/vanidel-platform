import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
} from 'payload'

import type { Locale } from '@/i18n/config'
import type { Attribution } from '@/modules/analytics/domain/attribution'
import { normalizePhone } from '@/modules/audience/domain/phone'
import { isWilayaCode } from '@/modules/audience/domain/wilayas'
import type { Contest, Ticket } from '@/payload-types'

import { drawPeriodFor } from '../domain/drawPeriod'
import { contestPhase } from '../domain/phase'
import { advisoryLock } from './advisoryLock'
import {
  prepareTicket,
  removeTicketFiles,
  storeTicket,
  TicketRejectedError,
  type PreparedTicket,
} from './storeTicket'

/** Why a submission was refused; the form translates each code. */
export const participationErrorCodes = [
  'contest-not-found',
  'contest-not-open',
  'contest-closed',
  'invalid-name',
  'invalid-phone',
  'invalid-email',
  'invalid-wilaya',
  'consent-required',
  'consents-changed',
  'ticket-missing',
  'ticket-too-large',
  'ticket-unsupported',
  'duplicate-ticket',
  'entry-limit',
] as const

export type ParticipationErrorCode = (typeof participationErrorCodes)[number]

export class ParticipationError extends Error {
  constructor(
    readonly code: ParticipationErrorCode,
    /** The form field at fault, e.g. `phone` or `consent.regulation`. */
    readonly field?: string,
  ) {
    super(`Participation refused: ${code}${field ? ` (${field})` : ''}`)
    this.name = 'ParticipationError'
  }
}

export interface ParticipationInput {
  contestSlug: string
  locale: Locale
  name: string
  phone: string
  email?: string
  wilaya?: string
  /** Checkbox state per consent type configured on the contest. */
  consents: Record<string, boolean>
  /**
   * Text version of each consent as displayed to the visitor. Recorded as what they agreed to,
   * so it must still be the contest's current version.
   */
  consentVersions: Record<string, string>
  /** The receipt photo as uploaded. */
  ticket: Buffer
  attribution?: Attribution | null
  /** Submission time; defaults to now. */
  now?: Date
}

export interface ParticipationResult {
  participationId: number
  contactId: number
  ticketId: number
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Stored values are kept as submitted (SPECIFICATION §7.1), only trimmed.
function trim(value: string | undefined): string {
  return (value ?? '').trim()
}

/** Field checks that need only the contest settings, before any database write. */
function validate(contest: Contest, input: ParticipationInput) {
  const name = trim(input.name)
  if (name.length < 2 || name.length > 100 || !/\p{L}/u.test(name)) {
    throw new ParticipationError('invalid-name', 'name')
  }

  const phone = trim(input.phone)
  const phoneNormalized = normalizePhone(phone)
  if (!phoneNormalized) throw new ParticipationError('invalid-phone', 'phone')

  let email: string | undefined
  const emailSetting = contest.form?.email ?? 'optional'
  if (emailSetting !== 'off') {
    email = trim(input.email) || undefined
    if (!email && emailSetting === 'required') {
      throw new ParticipationError('invalid-email', 'email')
    }
    if (email && (email.length > 254 || !emailPattern.test(email))) {
      throw new ParticipationError('invalid-email', 'email')
    }
  }

  const wilaya = trim(input.wilaya) || undefined
  if (wilaya ? !isWilayaCode(wilaya) : contest.form?.wilayaRequired !== false) {
    throw new ParticipationError('invalid-wilaya', 'wilaya')
  }

  // The visitor must have seen exactly the current consent texts. A page loaded (or served from
  // cache) before staff changed them would otherwise record agreement to wording never shown.
  const shown = Object.entries(input.consentVersions)
  const current = contest.consents ?? []
  if (
    shown.length !== current.length ||
    current.some(({ type, textVersion }) => input.consentVersions[type] !== textVersion)
  ) {
    throw new ParticipationError('consents-changed')
  }

  const consents = (contest.consents ?? []).map((consent) => ({
    ...consent,
    granted: input.consents[consent.type] === true,
  }))
  const refused = consents.find(({ required, granted }) => required && !granted)
  if (refused) throw new ParticipationError('consent-required', `consent.${refused.type}`)

  if (input.ticket.length === 0) throw new ParticipationError('ticket-missing', 'ticket')

  return { name, phone, phoneNormalized, email, wilaya, consents }
}

async function prepare(data: Buffer): Promise<PreparedTicket> {
  try {
    return await prepareTicket(data)
  } catch (error) {
    if (error instanceof TicketRejectedError) {
      throw new ParticipationError(
        error.reason === 'too-large' ? 'ticket-too-large' : 'ticket-unsupported',
        'ticket',
      )
    }
    throw error
  }
}

/**
 * Records one participation (ARCHITECTURE §10): checks the contest is open and the fields valid,
 * refuses duplicates (same receipt in the contest, or the phone over its entry limit for the
 * current draw period), then stores the ticket, finds or creates the Contact by phone (never
 * updating it), and saves the Participation snapshot with one ConsentRecord per contest consent.
 *
 * Everything is written in one transaction. Submissions with the same phone, or the same receipt
 * in a contest, are serialized with advisory locks, so concurrent requests cannot both pass the
 * duplicate checks. Throws `ParticipationError` for anything the participant can fix.
 */
export async function submitParticipation(
  payload: Payload,
  input: ParticipationInput,
): Promise<ParticipationResult> {
  const now = input.now ?? new Date()

  const {
    docs: [contest],
  } = await payload.find({
    collection: 'contests',
    where: { slug: { equals: input.contestSlug }, status: { not_equals: 'draft' } },
    depth: 0,
    limit: 1,
  })
  if (!contest) throw new ParticipationError('contest-not-found')

  const phase = contestPhase(contest, now)
  if (phase === 'scheduled') throw new ParticipationError('contest-not-open')
  if (phase !== 'open') throw new ParticipationError('contest-closed')

  const fields = validate(contest, input)
  const prepared = await prepare(input.ticket)
  const period = drawPeriodFor(contest, now)
  if (!period) throw new ParticipationError('contest-closed')

  const req = await createLocalReq({}, payload)
  await initTransaction(req)
  let ticket: Ticket | undefined
  try {
    // Phone first, then receipt: a fixed order, so two submissions cannot deadlock.
    await advisoryLock(payload, req, `participation:phone:${fields.phoneNormalized}`)
    await advisoryLock(payload, req, `participation:ticket:${contest.id}:${prepared.hash}`)

    const { totalDocs: entries } = await payload.count({
      collection: 'participations',
      where: {
        contest: { equals: contest.id },
        phoneNormalized: { equals: fields.phoneNormalized },
        submittedAt: {
          greater_than_equal: period.start.toISOString(),
          less_than: period.end.toISOString(),
        },
      },
      req,
    })
    if (entries >= contest.entryLimitPerPhone) {
      throw new ParticipationError('entry-limit', 'phone')
    }

    try {
      ticket = await storeTicket(payload, { contestId: contest.id, data: prepared, req })
    } catch (error) {
      if (error instanceof TicketRejectedError && error.reason === 'duplicate') {
        throw new ParticipationError('duplicate-ticket', 'ticket')
      }
      throw error
    }

    const {
      docs: [existing],
    } = await payload.find({
      collection: 'contacts',
      where: { phoneNormalized: { equals: fields.phoneNormalized } },
      depth: 0,
      limit: 1,
      req,
    })
    const contact =
      existing ??
      (await payload.create({
        collection: 'contacts',
        data: {
          phoneNormalized: fields.phoneNormalized,
          name: fields.name,
          emailNormalized: fields.email?.toLowerCase(),
          wilaya: fields.wilaya,
          firstContest: contest.id,
        },
        req,
      }))

    const submittedAt = now.toISOString()
    const participation = await payload.create({
      collection: 'participations',
      data: {
        contest: contest.id,
        contact: contact.id,
        submittedAt,
        periodStart: period.start.toISOString(),
        name: fields.name,
        phone: fields.phone,
        phoneNormalized: fields.phoneNormalized,
        email: fields.email,
        wilaya: fields.wilaya,
        ticket: ticket.id,
        locale: input.locale,
        source: input.attribution?.source,
        utmSource: input.attribution?.utmSource,
        utmMedium: input.attribution?.utmMedium,
        utmCampaign: input.attribution?.utmCampaign,
        utmContent: input.attribution?.utmContent,
      },
      depth: 0,
      req,
    })

    for (const consent of fields.consents) {
      await payload.create({
        collection: 'consent-records',
        data: {
          contact: contact.id,
          participation: participation.id,
          type: consent.type,
          granted: consent.granted,
          textVersion: consent.textVersion,
          capturedAt: submittedAt,
          source: 'participation-form',
        },
        req,
      })
    }

    await commitTransaction(req)
    return { participationId: participation.id, contactId: contact.id, ticketId: ticket.id }
  } catch (error) {
    await killTransaction(req)
    if (ticket) await removeTicketFiles(payload, ticket, req)
    throw error
  }
}
