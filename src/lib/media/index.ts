import type { Media } from '@/payload-types'

/** A populated upload relation, or null when it is empty or only an ID. */
export function populated(value: unknown): Media | null {
  return typeof value === 'object' && value !== null ? (value as Media) : null
}

/** A sized version of an image (e.g. `hero`, `og`), falling back to the original. */
export function imageSize(media: Media, size: keyof NonNullable<Media['sizes']>) {
  const sized = media.sizes?.[size]
  return sized?.url && sized.width && sized.height
    ? { url: sized.url, width: sized.width, height: sized.height }
    : media.url && media.width && media.height
      ? { url: media.url, width: media.width, height: media.height }
      : null
}

/**
 * The share image of pages that have none of their own: logo, slogan and packshots on red, made by
 * `pnpm brand:assets` (docs/brand/README.md).
 */
export const defaultShareImage = {
  url: '/brand/share/vanidel-share-default.png',
  width: 1200,
  height: 630,
} as const

/**
 * The image a contest is shared with: its share image, else its hero, at the Open Graph size
 * (1200×630). Null when it has neither.
 */
export function contestVisual(contest: {
  slug: string
  shareMedia?: unknown
  heroMedia?: unknown
}): { url: string; width: number; height: number; filename: string } | null {
  const media = populated(contest.shareMedia) ?? populated(contest.heroMedia)
  const image = media && imageSize(media, 'og')
  if (!image) return null
  const extension = image.url.split('?')[0].split('.').pop() || 'jpg'
  return { ...image, filename: `${contest.slug}.${extension}` }
}

/**
 * The image of a contest's card in the lists: its hero, as on the contest page, else its share
 * image. Null when it has neither.
 */
export function contestCardImage(contest: { heroMedia?: unknown; shareMedia?: unknown }) {
  const hero = populated(contest.heroMedia)
  if (hero) return imageSize(hero, 'hero')
  const share = populated(contest.shareMedia)
  return share && imageSize(share, 'og')
}
