/**
 * Links visitors share (SPECIFICATION §16–17). They point at the locale-independent entry URL, so
 * a French visitor's share opens in Arabic for an Arabic reader, and carry UTM tags so visits and
 * participations they bring are attributed to sharing on that network (§13.1).
 */
export const shareChannels = ['native', 'whatsapp', 'instagram', 'copy'] as const

export type ShareChannel = (typeof shareChannels)[number]

/** `utm_source` per channel: the device share sheet cannot tell which app was picked. */
const sources: Record<ShareChannel, string> = {
  native: 'share',
  whatsapp: 'whatsapp',
  instagram: 'instagram',
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

/** WhatsApp's share dialog, with the text and link prefilled. */
export function whatsappShareUrl(link: string, text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`
}

/**
 * Instagram has no web share dialog: the link is copied, then Instagram opens (the app on phones)
 * for the visitor to paste it in a story or a message.
 */
export const instagramUrl = 'https://www.instagram.com/'
