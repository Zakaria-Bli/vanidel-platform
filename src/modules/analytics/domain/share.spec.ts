import { describe, expect, it } from 'vitest'

import { attributionFromSearch } from './attribution'
import { contestShareUrl, whatsappShareUrl } from './share'

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
    const url = new URL(contestShareUrl('https://vanidel.example', 'ete', 'instagram'))
    expect(attributionFromSearch(url.searchParams)).toMatchObject({
      source: 'instagram',
      utmMedium: 'share',
      utmCampaign: 'ete',
    })
  })
})

describe('whatsappShareUrl', () => {
  it('puts the text and link in a WhatsApp message', () => {
    const link = 'https://vanidel.example/concours/ete?utm_source=whatsapp'
    const url = new URL(whatsappShareUrl(link, 'Participez !'))
    expect(url.origin).toBe('https://wa.me')
    expect(url.searchParams.get('text')).toBe(`Participez ! ${link}`)
  })
})
