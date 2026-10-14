/**
 * Links visitors share (SPECIFICATION §16–17). They point at the locale-independent entry URL, so
 * a French visitor's share opens in Arabic for an Arabic reader, and carry UTM tags so visits and
 * participations they bring are attributed to sharing on that network (§13.1).
 */
export const shareChannels = ['native', 'whatsapp', 'facebook', 'copy'] as const

export type ShareChannel = (typeof shareChannels)[number]

/** `utm_source` per channel: the device share sheet cannot tell which app was picked. */
const sources: Record<ShareChannel, string> = {
  native: 'share',
  whatsapp: 'whatsapp',
  facebook: 'facebook',
  copy: 'share',
}

export const shareMedium = 'share'

/** The contest's entry URL tagged for one channel, e.g. `…/concours/ete?utm_source=whatsapp…`. */
export function contestShareUrl(siteUrl: string, slug: string, channel: ShareChannel): string {
  const url = new URL(`/concours/${encodeURIComponent(slug)}`, siteUrl)
  url.searchParams.set('utm_source', sources[channel])
  url.searchParams.set('utm_medium', shareMedium)
  url.searchParams.set('utm_campaign', slug)
  return url.toString()
}

/** Where each network's share dialog takes the link; the device sheet and copying need none. */
export function networkShareUrl(
  channel: Extract<ShareChannel, 'whatsapp' | 'facebook'>,
  link: string,
  text: string,
): string {
  switch (channel) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
  }
}
