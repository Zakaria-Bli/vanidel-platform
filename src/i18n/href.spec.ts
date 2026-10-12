import { describe, expect, it } from 'vitest'

import { withSearch } from './href'

describe('withSearch', () => {
  it('keeps every query parameter, including repeated ones', () => {
    const search = new URLSearchParams('utm_source=qr&utm_campaign=ete-2026&tag=a&tag=b')

    expect(withSearch('/concours/ete-2026', search)).toBe(
      '/concours/ete-2026?utm_source=qr&utm_campaign=ete-2026&tag=a&tag=b',
    )
  })

  it('accepts a search string with or without its question mark', () => {
    expect(withSearch('/concours', '?utm_source=qr')).toBe('/concours?utm_source=qr')
    expect(withSearch('/concours', 'utm_source=qr')).toBe('/concours?utm_source=qr')
  })

  it('returns the bare path without a query', () => {
    expect(withSearch('/concours', new URLSearchParams())).toBe('/concours')
    expect(withSearch('/concours', '')).toBe('/concours')
  })
})
