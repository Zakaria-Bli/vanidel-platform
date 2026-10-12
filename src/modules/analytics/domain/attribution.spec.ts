import { describe, expect, it } from 'vitest'

import { attributionFromSearch, parseAttribution, serializeAttribution } from './attribution'

const now = new Date('2026-10-15T09:00:00.000Z')

describe('attributionFromSearch', () => {
  it('reads UTM parameters and uses utm_source as the channel', () => {
    const search = new URLSearchParams(
      'utm_source=Facebook&utm_medium=social&utm_campaign=rentree&utm_content=video',
    )

    expect(attributionFromSearch(search, now)).toEqual({
      source: 'facebook',
      utmSource: 'Facebook',
      utmMedium: 'social',
      utmCampaign: 'rentree',
      utmContent: 'video',
      landedAt: now.toISOString(),
    })
  })

  it('prefers an explicit src channel', () => {
    expect(
      attributionFromSearch(new URLSearchParams('src=qr&utm_source=poster'), now),
    ).toMatchObject({ source: 'qr', utmSource: 'poster' })
  })

  it('returns null without a channel', () => {
    expect(attributionFromSearch(new URLSearchParams(''), now)).toBeNull()
    expect(attributionFromSearch(new URLSearchParams('utm_medium=social'), now)).toBeNull()
    expect(attributionFromSearch(new URLSearchParams('utm_source=%20%20'), now)).toBeNull()
  })

  it('truncates overlong values', () => {
    const attribution = attributionFromSearch(new URLSearchParams(`src=${'x'.repeat(500)}`), now)
    expect(attribution?.source).toHaveLength(100)
  })
})

describe('parseAttribution', () => {
  it('round-trips a serialized attribution', () => {
    const attribution = attributionFromSearch(new URLSearchParams('utm_source=qr'), now)!
    expect(parseAttribution(serializeAttribution(attribution))).toEqual(attribution)
  })

  it.each([
    ['nothing', undefined],
    ['invalid JSON', '{nope'],
    ['a non-object', '"qr"'],
    ['no source', JSON.stringify({ landedAt: now.toISOString() })],
    ['a bad date', JSON.stringify({ source: 'qr', landedAt: 'yesterday' })],
  ])('ignores %s', (_, value) => {
    expect(parseAttribution(value)).toBeNull()
  })

  it('drops unknown or non-string fields', () => {
    const value = JSON.stringify({
      source: 'qr',
      landedAt: now.toISOString(),
      utmMedium: 42,
      admin: true,
    })
    expect(parseAttribution(value)).toEqual({ source: 'qr', landedAt: now.toISOString() })
  })
})
