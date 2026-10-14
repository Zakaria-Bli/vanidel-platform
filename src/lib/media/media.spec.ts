import { describe, expect, it } from 'vitest'

import type { Media } from '@/payload-types'

import { contestVisual } from './index'

const image = (name: string): Partial<Media> => ({
  url: `/api/media/file/${name}.png`,
  width: 2400,
  height: 1260,
  sizes: { og: { url: `/api/media/file/${name}-1200x630.webp`, width: 1200, height: 630 } },
})

describe('contestVisual', () => {
  it('uses the share image at the Open Graph size, named after the contest', () => {
    expect(
      contestVisual({ slug: 'ete', shareMedia: image('share'), heroMedia: image('hero') }),
    ).toEqual({
      url: '/api/media/file/share-1200x630.webp',
      width: 1200,
      height: 630,
      filename: 'ete.webp',
    })
  })

  it('falls back to the hero', () => {
    expect(contestVisual({ slug: 'ete', heroMedia: image('hero') })?.url).toBe(
      '/api/media/file/hero-1200x630.webp',
    )
  })

  it('is null without either, or when only IDs are loaded', () => {
    expect(contestVisual({ slug: 'ete' })).toBeNull()
    expect(contestVisual({ slug: 'ete', shareMedia: 4 })).toBeNull()
  })
})
