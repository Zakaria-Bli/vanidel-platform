import type { Payload } from 'payload'
import sharp from 'sharp'

import type { Contest, Media, User } from '@/payload-types'

export const seedContestSlug = 'concours-demo'

export interface SeedOptions {
  adminPassword: string
  commercialPassword: string
  now?: Date
}

const day = 24 * 60 * 60 * 1000

function text(value: string) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: null,
      children: [
        {
          type: 'paragraph',
          format: '' as const,
          indent: 0,
          version: 1,
          direction: null,
          textFormat: 0,
          children: [
            {
              type: 'text',
              text: value,
              format: 0,
              detail: 0,
              mode: 'normal',
              style: '',
              version: 1,
            },
          ],
        },
      ],
    },
  }
}

async function ensureUser(
  payload: Payload,
  email: string,
  role: User['role'],
  password: string,
): Promise<User> {
  const { docs } = await payload.find({ collection: 'users', where: { email: { equals: email } } })
  return docs[0] ?? payload.create({ collection: 'users', data: { email, password, role } })
}

/** A placeholder visual in the brand red, generated so the repository carries no binaries. */
async function ensureImage(
  payload: Payload,
  name: string,
  size: { width: number; height: number },
  alt: { fr: string; ar: string },
): Promise<Media> {
  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { equals: name } },
  })
  if (docs[0]) return docs[0]

  const data = await sharp({
    create: { ...size, channels: 3, background: { r: 233, g: 28, b: 35 } },
  })
    .png()
    .toBuffer()
  const media = await payload.create({
    collection: 'media',
    locale: 'fr',
    data: { alt: alt.fr },
    file: { data, mimetype: 'image/png', name, size: data.length },
  })
  return payload.update({ collection: 'media', id: media.id, locale: 'ar', data: { alt: alt.ar } })
}

/**
 * Development data: an admin, a commercial user and one published French/Arabic contest open for
 * four weeks. Safe to run repeatedly; existing records (matched by email, file name or slug) are
 * left as they are.
 */
export async function seed(payload: Payload, options: SeedOptions): Promise<Contest> {
  const now = options.now ?? new Date()

  await ensureUser(payload, 'admin@vanidel.local', 'admin', options.adminPassword)
  await ensureUser(payload, 'commercial@vanidel.local', 'commercial', options.commercialPassword)

  const existing = await payload.find({
    collection: 'contests',
    where: { slug: { equals: seedContestSlug } },
  })
  if (existing.docs[0]) return existing.docs[0]

  const hero = await ensureImage(
    payload,
    'seed-hero.png',
    { width: 1600, height: 900 },
    {
      fr: 'Visuel du concours de démonstration',
      ar: 'صورة مسابقة العرض',
    },
  )
  const share = await ensureImage(
    payload,
    'seed-share.png',
    { width: 1200, height: 630 },
    {
      fr: 'Image de partage du concours de démonstration',
      ar: 'صورة مشاركة مسابقة العرض',
    },
  )

  const contest = await payload.create({
    collection: 'contests',
    locale: 'fr',
    data: {
      slug: seedContestSlug,
      status: 'draft',
      startAt: new Date(now.getTime() - day).toISOString(),
      endAt: new Date(now.getTime() + 28 * day).toISOString(),
      title: 'Concours de démonstration',
      description: text('Achetez un produit Vanidel et tentez de gagner chaque semaine.'),
      steps: [
        {
          text: 'Remplissez le formulaire et envoyez une photo lisible de votre ticket de caisse.',
        },
      ],
      seo: {
        title: 'Concours de démonstration Vanidel',
        description: 'Participez au concours Vanidel et gagnez des lots chaque semaine.',
      },
      heroMedia: hero.id,
      shareMedia: share.id,
      prizes: [
        { title: 'Panier de produits Vanidel', quantity: 4 },
        { title: 'Bon d’achat', quantity: 10 },
      ],
      form: { email: 'optional', wilayaRequired: true },
      entryLimitPerPhone: 1,
      draw: { periodDays: 7, winnersPerDraw: 1 },
      consents: [
        {
          type: 'regulation',
          required: true,
          label: 'J’ai lu et j’accepte le règlement du concours.',
          textVersion: '2026-10-v1',
        },
        {
          type: 'marketing',
          required: false,
          label: 'J’accepte de recevoir les offres et nouveautés de Vanidel.',
          textVersion: '2026-10-v1',
        },
      ],
    },
  })

  // Array rows keep their IDs across locales, so the Arabic texts land on the same prizes.
  const [basket, voucher] = contest.prizes ?? []
  const [regulation, marketing] = contest.consents ?? []
  await payload.update({
    collection: 'contests',
    id: contest.id,
    locale: 'ar',
    data: {
      title: 'مسابقة العرض',
      description: text('اشتروا منتجًا من Vanidel وحاولوا الفوز كل أسبوع.'),
      steps: (contest.steps ?? []).map((step) => ({
        ...step,
        text: 'املؤوا الاستمارة وأرسلوا صورة واضحة لتذكرة الشراء.',
      })),
      seo: {
        title: 'مسابقة العرض من Vanidel',
        description: 'شاركوا في مسابقة Vanidel واربحوا جوائز كل أسبوع.',
      },
      prizes: [
        { ...basket, title: 'سلة منتجات Vanidel' },
        { ...voucher, title: 'قسيمة شراء' },
      ],
      consents: [
        { ...regulation, label: 'قرأت نظام المسابقة وأوافق عليه.' },
        { ...marketing, label: 'أوافق على تلقي عروض Vanidel وجديدها.' },
      ],
    },
  })

  return payload.update({ collection: 'contests', id: contest.id, data: { status: 'published' } })
}
