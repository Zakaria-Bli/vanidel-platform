import { describe, expect, it } from 'vitest'

import { conversionPayloads, hasTracking, readCookieConsent } from './tracking'

describe('readCookieConsent', () => {
  it('reads the stored choice', () => {
    expect(readCookieConsent('a=1; vanidel_cookie_consent=granted; b=2')).toBe('granted')
    expect(readCookieConsent('vanidel_cookie_consent=denied')).toBe('denied')
  })

  it('treats a missing or unknown value as no choice', () => {
    expect(readCookieConsent('')).toBeNull()
    expect(readCookieConsent('vanidel_cookie_consent=maybe')).toBeNull()
  })
})

describe('hasTracking', () => {
  it('is true when any pixel is configured', () => {
    expect(hasTracking({ metaPixelId: '123456789012345' })).toBe(true)
    expect(hasTracking({ ga4Id: 'G-ABC' })).toBe(true)
    expect(hasTracking({ metaPixelId: null, ga4Id: '' })).toBe(false)
    expect(hasTracking(null)).toBe(false)
  })
})

describe('conversionPayloads', () => {
  it('sends the contest slug and nothing about the participant', () => {
    const payloads = conversionPayloads('mix-rentree-2026')

    expect(payloads.meta).toEqual(['track', 'Lead', { content_name: 'mix-rentree-2026' }])
    expect(payloads.ga4).toEqual(['event', 'generate_lead', { contest: 'mix-rentree-2026' }])
    // The slug is the only value either service receives.
    expect([payloads.meta[2], payloads.ga4[2]].flatMap(Object.values)).toEqual([
      'mix-rentree-2026',
      'mix-rentree-2026',
    ])
  })
})
