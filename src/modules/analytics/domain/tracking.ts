/**
 * Visitor choice about analytics cookies (Meta Pixel, Google Analytics). Nothing loads until the
 * visitor accepts; the choice is kept six months and can be changed from the footer.
 */
export const cookieConsentName = 'vanidel_cookie_consent'
export const cookieConsentMaxAge = 182 * 24 * 60 * 60

export type CookieConsent = 'granted' | 'denied'

/** The stored choice from a `document.cookie` string, or null when the visitor has not chosen. */
export function readCookieConsent(cookieHeader: string): CookieConsent | null {
  const value = cookieHeader
    .split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === cookieConsentName)?.[1]
  return value === 'granted' || value === 'denied' ? value : null
}

export interface TrackingIds {
  metaPixelId?: string | null
  ga4Id?: string | null
}

export const hasTracking = (ids: TrackingIds | null): boolean =>
  Boolean(ids?.metaPixelId || ids?.ga4Id)

/** Browser event fired when a participation is accepted. */
export const participationEvent = 'vanidel:participation'

/**
 * What a conversion sends to Meta and Google: the contest slug only. Form contents (name, phone,
 * email, wilaya) never leave the platform (ARCHITECTURE §1, data residency).
 */
export function conversionPayloads(contestSlug: string) {
  return {
    meta: ['track', 'Lead', { content_name: contestSlug }] as const,
    ga4: ['event', 'generate_lead', { contest: contestSlug }] as const,
  }
}
