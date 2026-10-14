import { describe, expect, it } from 'vitest'

import { attributionFromSearch } from './attribution'
import { campaignLinkTags, campaignLinkUrl } from './campaignLinks'

const site = 'https://vanidel.example'

describe('campaignLinkUrl', () => {
  it('tags the packaging QR code', () => {
    expect(campaignLinkUrl(site, 'ete', { channel: 'qr' })).toBe(
      'https://vanidel.example/concours/ete?utm_source=qr&utm_medium=packaging',
    )
  })

  it('tells influencers apart by their code', () => {
    const url = new URL(campaignLinkUrl(site, 'ete', { channel: 'influencer', code: 'sarah' }))
    expect(url.searchParams.get('utm_source')).toBe('influencer')
    expect(url.searchParams.get('utm_content')).toBe('sarah')
  })

  it('uses the code as the source of other channels', () => {
    expect(campaignLinkTags({ channel: 'other', code: 'radio-dzair' })).toEqual({
      source: 'radio-dzair',
      medium: 'referral',
    })
  })

  it('is recorded as the visitor’s attribution', () => {
    const url = new URL(campaignLinkUrl(site, 'ete', { channel: 'poster', code: 'oran-centre' }))
    expect(attributionFromSearch(url.searchParams)).toMatchObject({
      source: 'poster',
      utmMedium: 'print',
      utmContent: 'oran-centre',
    })
  })

  it('leaves out an empty code', () => {
    expect(campaignLinkUrl(site, 'ete', { channel: 'tiktok', code: ' ' })).not.toContain(
      'utm_content',
    )
  })
})
