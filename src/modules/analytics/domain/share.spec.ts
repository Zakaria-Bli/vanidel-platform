import { describe, expect, it } from 'vitest'

import { attributionFromSearch } from './attribution'
import { contestShareUrl, networkShareUrl } from './share'

describe('contestShareUrl', () => {
  it('points at the locale-independent entry URL, tagged for the channel', () => {
    expect(contestShareUrl('https://vanidel.example/', 'ete-2026', 'whatsapp')).toBe(
      'https://vanidel.example/concours/ete-2026?utm_source=whatsapp&utm_medium=share&utm_campaign=ete-2026',
    )
  })

  it('tags the device share sheet and copied links as generic shares', () => {
    for (const channel of ['native', 'copy'] as const) {
      const url = new URL(contestShareUrl('https://vanidel.example', 'ete', channel))
      expect(url.searchParams.get('utm_source')).toBe('share')
    }
  })

  it('is attributed when someone lands on it', () => {
    const url = new URL(contestShareUrl('https://vanidel.example', 'ete', 'facebook'))
    expect(attributionFromSearch(url.searchParams)).toMatchObject({
      source: 'facebook',
      utmMedium: 'share',
      utmCampaign: 'ete',
    })
  })
})

describe('networkShareUrl', () => {
  const link = 'https://vanidel.example/concours/ete?utm_source=whatsapp'

  it('puts the text and link in a WhatsApp message', () => {
    const url = new URL(networkShareUrl('whatsapp', link, 'Participez !'))
    expect(url.origin).toBe('https://wa.me')
    expect(url.searchParams.get('text')).toBe(`Participez ! ${link}`)
  })

  it('gives Facebook the link only; it reads the preview from the page', () => {
    const url = new URL(networkShareUrl('facebook', link, 'ignored'))
    expect(url.searchParams.get('u')).toBe(link)
  })
})
