import { attributionValueMaxLength } from './attribution'

/**
 * Tracked links per channel (SPECIFICATION §13.1): each points at the contest's
 * locale-independent entry URL with UTM tags, which the proxy records as the visitor's
 * attribution and the participation keeps. The report groups entries by those tags.
 */
export const campaignChannels = [
  'qr',
  'poster',
  'facebook',
  'instagram',
  'tiktok',
  'influencer',
  'other',
] as const

export type CampaignChannel = (typeof campaignChannels)[number]

/** `utm_source` and `utm_medium` per channel; `other` takes its source from the link's code. */
const tags: Record<Exclude<CampaignChannel, 'other'>, { source: string; medium: string }> = {
  qr: { source: 'qr', medium: 'packaging' },
  poster: { source: 'poster', medium: 'print' },
  facebook: { source: 'facebook', medium: 'social' },
  instagram: { source: 'instagram', medium: 'social' },
  tiktok: { source: 'tiktok', medium: 'social' },
  influencer: { source: 'influencer', medium: 'influencer' },
}

/** Channels whose links need a code telling them apart: each influencer, each other source. */
export const channelsWithRequiredCode: readonly CampaignChannel[] = ['influencer', 'other']

/** Lowercase letters, digits and dashes: safe in URLs and readable on a report. */
export const campaignCodePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Attribution records at most this many characters per tag, so a longer code would be recorded
 * cut short: its entries would not match its link, and codes sharing a prefix would merge.
 */
export const campaignCodeMaxLength = attributionValueMaxLength

export type CampaignCodeProblem = 'required' | 'format' | 'too-long'

/** Why a link's code cannot be used, or null when it can (or may be left empty). */
export function campaignCodeProblem(
  code: string | null | undefined,
  channel: CampaignChannel | undefined,
): CampaignCodeProblem | null {
  const trimmed = code?.trim() ?? ''
  if (!trimmed) return channel && channelsWithRequiredCode.includes(channel) ? 'required' : null
  if (trimmed.length > campaignCodeMaxLength) return 'too-long'
  return campaignCodePattern.test(trimmed) ? null : 'format'
}

export interface CampaignLinkTags {
  source: string
  medium: string
  content?: string
}

export interface CampaignLinkInput {
  channel: CampaignChannel
  /** Tells links of one channel apart, e.g. an influencer's handle or a poster's location. */
  code?: string | null
}

export function campaignLinkTags(link: CampaignLinkInput): CampaignLinkTags {
  const code = link.code?.trim() || undefined
  const { source, medium } =
    link.channel === 'other' ? { source: code ?? 'other', medium: 'referral' } : tags[link.channel]
  return {
    source,
    medium,
    // For `other` the code already is the source.
    content: link.channel === 'other' ? undefined : code,
  }
}

/**
 * E.g. `https://…/concours/ete?utm_source=qr&utm_medium=packaging`. No `utm_campaign`: the path
 * already names the contest, and a shorter address prints as a sparser, easier-to-scan QR code.
 */
export function campaignLinkUrl(
  siteUrl: string,
  contestSlug: string,
  link: CampaignLinkInput,
): string {
  const tagged = campaignLinkTags(link)
  const url = new URL(`/concours/${encodeURIComponent(contestSlug)}`, siteUrl)
  url.searchParams.set('utm_source', tagged.source)
  url.searchParams.set('utm_medium', tagged.medium)
  if (tagged.content) url.searchParams.set('utm_content', tagged.content)
  return url.toString()
}
