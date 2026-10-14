import type { CollectionConfig, FieldHook } from 'payload'

import { env } from '@/lib/env'
import {
  campaignChannels,
  campaignCodePattern,
  campaignLinkUrl,
  channelsWithRequiredCode,
  type CampaignChannel,
} from '@/modules/analytics/domain/campaignLinks'

import { isStaff } from '../access'
import { groups, label } from '../fields/label'

const channelLabels: Record<CampaignChannel, Record<'fr' | 'en' | 'ar', string>> = {
  qr: label('QR code emballage', 'Packaging QR code', 'رمز QR على العبوة'),
  poster: label('Affiche', 'Poster', 'ملصق'),
  facebook: label('Facebook', 'Facebook', 'فيسبوك'),
  instagram: label('Instagram', 'Instagram', 'إنستغرام'),
  tiktok: label('TikTok', 'TikTok', 'تيك توك'),
  influencer: label('Influenceur', 'Influencer', 'مؤثر'),
  other: label('Autre', 'Other', 'أخرى'),
}

/** The link, rebuilt on every read from the contest's current slug. */
const linkUrl: FieldHook = async ({ siblingData, req }) => {
  const { contest, channel, code } = siblingData as {
    contest?: number | { slug?: string }
    channel?: CampaignChannel
    code?: string | null
  }
  if (!contest || !channel) return null
  const slug =
    typeof contest === 'object'
      ? contest.slug
      : (
          await req.payload
            .findByID({
              collection: 'contests',
              id: contest,
              depth: 0,
              select: { slug: true },
              req,
            })
            .catch(() => null)
        )?.slug
  return slug ? campaignLinkUrl(env.SITE_URL, slug, { channel, code }) : null
}

/**
 * Tracked links per channel (SPECIFICATION §13.1): the address to print on packaging and posters
 * or give to each network and influencer. Entries they bring are counted per link in the contest
 * report. Deleting a link does not change any recorded entry.
 */
export const CampaignLinks: CollectionConfig = {
  slug: 'campaign-links',
  labels: {
    singular: label('Lien de campagne', 'Campaign link', 'رابط الحملة'),
    plural: label('Liens de campagne', 'Campaign links', 'روابط الحملة'),
  },
  admin: {
    group: groups.contests,
    useAsTitle: 'name',
    defaultColumns: ['name', 'channel', 'contest', 'url'],
    description: label(
      'Un lien par canal à imprimer ou à partager : les participations qu’il apporte sont comptées dans le rapport du concours.',
      'One link per channel to print or share: the entries it brings are counted in the contest report.',
      'رابط لكل قناة للطباعة أو المشاركة: تُحتسب المشاركات القادمة منه في تقرير المسابقة.',
    ),
  },
  access: {
    read: isStaff,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  fields: [
    {
      name: 'name',
      label: label('Nom', 'Name', 'الاسم'),
      type: 'text',
      required: true,
      admin: {
        description: label(
          'Pour vous repérer, par exemple « Emballage 1 kg » ou « Instagram @sarah ».',
          'For your reference, for example "1 kg packaging" or "Instagram @sarah".',
          'للتعرّف عليه، مثال: «عبوة 1 كغ» أو «إنستغرام @sarah».',
        ),
      },
    },
    {
      name: 'contest',
      label: label('Concours', 'Contest', 'المسابقة'),
      type: 'relationship',
      relationTo: 'contests',
      required: true,
      index: true,
    },
    {
      name: 'channel',
      label: label('Canal', 'Channel', 'القناة'),
      type: 'select',
      required: true,
      options: campaignChannels.map((value) => ({ value, label: channelLabels[value] })),
    },
    {
      name: 'code',
      label: label('Code', 'Code', 'الرمز'),
      type: 'text',
      admin: {
        description: label(
          'Distingue les liens d’un même canal : nom de l’influenceur, lieu de l’affiche… Lettres minuscules, chiffres et tirets. Obligatoire pour « Influenceur » et « Autre ».',
          'Tells links of one channel apart: influencer name, poster location… Lowercase letters, digits and dashes. Required for "Influencer" and "Other".',
          'يميّز روابط القناة نفسها: اسم المؤثر، مكان الملصق… أحرف لاتينية صغيرة وأرقام وشرطات. إلزامي لـ«مؤثر» و«أخرى».',
        ),
      },
      validate: (
        value: unknown,
        { siblingData }: { siblingData: { channel?: CampaignChannel } },
      ) => {
        const code = typeof value === 'string' ? value.trim() : ''
        if (!code) {
          return siblingData.channel && channelsWithRequiredCode.includes(siblingData.channel)
            ? 'Code requis pour ce canal. / A code is required for this channel.'
            : true
        }
        return campaignCodePattern.test(code)
          ? true
          : 'Lettres minuscules, chiffres et tirets. / Lowercase letters, digits and dashes only.'
      },
    },
    {
      name: 'url',
      label: label('Lien', 'Link', 'الرابط'),
      type: 'text',
      virtual: true,
      admin: {
        readOnly: true,
        components: { Field: '/payload/components/CampaignLinkField#CampaignLinkField' },
      },
      hooks: { afterRead: [linkUrl] },
    },
  ],
}
