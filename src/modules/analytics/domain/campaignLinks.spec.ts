import { describe, expect, it } from 'vitest'

import { attributionFromSearch } from './attribution'
import {
  campaignCodeMaxLength,
  campaignCodeProblem,
  campaignLinkTags,
  campaignLinkUrl,
} from './campaignLinks'

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

describe('campaignCodeProblem', () => {
  const code = (length: number) => 'a'.repeat(length)

  it('accepts a code up to the length attribution records whole, and refuses a longer one', () => {
    expect(campaignCodeMaxLength).toBe(100)
    expect(campaignCodeProblem(code(100), 'influencer')).toBeNull()
    expect(campaignCodeProblem(code(101), 'influencer')).toBe('too-long')
  })

  it('records a code of the maximum length whole, so its entries match its link', () => {
    for (const channel of ['influencer', 'other'] as const) {
      const link = { channel, code: code(campaignCodeMaxLength) }
      const recorded = attributionFromSearch(
        new URL(campaignLinkUrl(site, 'ete', link)).searchParams,
      )
      const tags = campaignLinkTags(link)
      expect([recorded?.source, recorded?.utmMedium, recorded?.utmContent]).toEqual([
        tags.source,
        tags.medium,
        tags.content,
      ])
    }
  })

  it('requires a code for influencers and other sources only', () => {
    expect(campaignCodeProblem('', 'influencer')).toBe('required')
    expect(campaignCodeProblem(' ', 'other')).toBe('required')
    expect(campaignCodeProblem(null, 'qr')).toBeNull()
  })

  it('refuses anything but lowercase letters, digits and dashes', () => {
    expect(campaignCodeProblem('Sarah', 'influencer')).toBe('format')
    expect(campaignCodeProblem('oran centre', 'poster')).toBe('format')
    expect(campaignCodeProblem('oran-centre', 'poster')).toBeNull()
  })
})
