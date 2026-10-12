'use server'

import { cookies, headers } from 'next/headers'
import { hasLocale } from 'next-intl'
import { getPayload } from 'payload'

import {
  participationFields as fields,
  type ParticipationState,
} from '@/components/contests/participationState'
import { routing } from '@/i18n/routing'
import { clientIp, RateLimiter } from '@/lib/rateLimit'
import { attributionCookie, parseAttribution } from '@/modules/analytics/domain/attribution'
import {
  ParticipationError,
  submitParticipation,
} from '@/modules/contests/services/submitParticipation'
import config from '@/payload.config'

// 10 attempts per address per 10 minutes: room to fix typos, not to flood the draw pool.
// A module-level map is enough because production runs one Node.js process.
const globalForLimiter = globalThis as typeof globalThis & { participationLimiter?: RateLimiter }
const limiter = (globalForLimiter.participationLimiter ??= new RateLimiter(10, 10 * 60 * 1000))

const text = (formData: FormData, name: string) => {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export async function participate(
  _previous: ParticipationState,
  formData: FormData,
): Promise<ParticipationState> {
  // A filled honeypot is a bot: answer as if it worked, so it learns nothing, and store nothing.
  if (text(formData, fields.honeypot)) return { status: 'success' }

  if (!limiter.take(clientIp(await headers()))) {
    return { status: 'error', code: 'rate-limited' }
  }

  const locale = text(formData, fields.locale)
  const ticket = formData.get(fields.ticket)
  const consents = Object.fromEntries(
    [...formData.keys()]
      .filter((key) => key.startsWith(fields.consent))
      .map((key) => [key.slice(fields.consent.length), formData.get(key) === 'on']),
  )

  const payload = await getPayload({ config })
  try {
    await submitParticipation(payload, {
      contestSlug: text(formData, fields.contest),
      locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
      name: text(formData, fields.name),
      phone: text(formData, fields.phone),
      email: text(formData, fields.email),
      wilaya: text(formData, fields.wilaya),
      consents,
      ticket:
        ticket instanceof File && ticket.size > 0
          ? Buffer.from(await ticket.arrayBuffer())
          : Buffer.alloc(0),
      attribution: parseAttribution((await cookies()).get(attributionCookie)?.value),
    })
    return { status: 'success' }
  } catch (error) {
    if (error instanceof ParticipationError) {
      return { status: 'error', code: error.code, field: error.field }
    }
    payload.logger.error({ err: error, msg: 'Participation failed' })
    return { status: 'error', code: 'unexpected' }
  }
}
