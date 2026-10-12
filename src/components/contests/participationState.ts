import type { ParticipationErrorCode } from '@/modules/contests/services/submitParticipation'

/** Every reason the form can show, with a message per code in `participation.errors`. */
export type ParticipationFailure = ParticipationErrorCode | 'rate-limited' | 'unexpected'

export type ParticipationState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; code: ParticipationFailure; field?: string }

export const initialParticipationState: ParticipationState = { status: 'idle' }

/** Form field names, shared by the form and the action that reads it. */
export const participationFields = {
  contest: 'contest',
  locale: 'locale',
  name: 'name',
  phone: 'phone',
  email: 'email',
  wilaya: 'wilaya',
  ticket: 'ticket',
  /** Prefix: `consent.regulation`, `consent.marketing`… */
  consent: 'consent.',
  /** Prefix: the text version of each consent as displayed, `consentVersion.regulation`… */
  consentVersion: 'consentVersion.',
  /** Honeypot: hidden from people, filled in by naive bots. */
  honeypot: 'website',
} as const
