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
