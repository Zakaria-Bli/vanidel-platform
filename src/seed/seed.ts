import type { Payload } from 'payload'
import sharp from 'sharp'

import type { Contest, Media, User } from '@/payload-types'

export const seedContestSlug = 'gamme-mix-2026'

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
 * Placeholder contest content, modelled on a typical Algerian receipt contest until Vanidel sends
 * its own texts, visuals, rules and legal wording. Consent records keep the version of the
 * text accepted, so those captured with this wording stay recognizable once the final one replaces it.
 */

const content = {
  fr: {
    title: 'Concours Gamme Mix : tentez votre chance !',
    description:
      'Avec Vanidel, كلشي يسهال ! Achetez un produit Vanidel et tentez de gagner un bon d’achat ' +
      'd’une valeur de 10 000 DA. Le chef Ghano vous souhaite bonne chance !',
    steps: [
      'Achetez un produit Vanidel : Gamme Mix (crêpes, pancakes, brownies ou gaufres), Gamme ' +
        'Crème ou Gamme Flan. Tous les formats sont acceptés.',
      'Gardez votre ticket de caisse montrant l’achat du produit Vanidel.',
      'Scannez le QR code sur l’emballage ou les affiches, ou ouvrez directement cette page.',
      'Remplissez le formulaire de participation.',
      'Ajoutez une photo claire et lisible de votre ticket de caisse.',
      'Validez votre participation.',
    ],
    prize: {
      title: 'Bon d’achat de 10 000 DA',
      description: 'Un gagnant tiré au sort chaque semaine.',
    },
    seo: {
      title: 'Concours Vanidel Gamme Mix',
      description: 'Achetez un produit Vanidel et tentez de gagner un bon d’achat de 10 000 DA.',
    },
    consents: {
      regulation: 'J’accepte le règlement du concours.',
      dataProcessing:
        'J’accepte que mes données personnelles (nom et prénom, numéro de téléphone, adresse ' +
        'e-mail et wilaya) soient collectées et traitées par Vanidel et ses prestataires ' +
        'habilités pour gérer ma participation à ce concours et, si je gagne, pour publier mon ' +
        'prénom, l’initiale de mon nom et ma wilaya pendant la durée de l’opération, ' +
        'conformément à la loi n° 18-07 modifiée et complétée par la loi n° 25-11.',
      marketing: 'J’accepte de recevoir les offres et nouveautés de Vanidel.',
    },
    alt: { hero: 'Produits Vanidel de la Gamme Mix', share: 'Concours Vanidel Gamme Mix' },
  },
  ar: {
    title: 'مسابقة تشكيلة Mix: جرّبوا حظكم!',
    description:
      'مع Vanidel، كلشي يسهال! اشتروا منتجًا من Vanidel وحاولوا الفوز بقسيمة شراء بقيمة ' +
      '10 000 دج. الشاف غانو يتمنى لكم حظًا موفقًا!',
    steps: [
      'اشتروا منتجًا من Vanidel: تشكيلة Mix (كريب، بان كيك، براوني أو وافل)، تشكيلة Crème أو ' +
        'تشكيلة Flan. جميع الأحجام مقبولة.',
      'احتفظوا بتذكرة الشراء التي تُظهر شراء منتج Vanidel.',
      'امسحوا رمز QR الموجود على العبوة أو الملصقات، أو افتحوا هذه الصفحة مباشرة.',
      'املؤوا استمارة المشاركة.',
      'أضيفوا صورة واضحة ومقروءة لتذكرة الشراء.',
      'أكّدوا مشاركتكم.',
    ],
    prize: {
      title: 'قسيمة شراء بقيمة 10 000 دج',
      description: 'فائز واحد يتم اختياره بالقرعة كل أسبوع.',
    },
    seo: {
      title: 'مسابقة Vanidel تشكيلة Mix',
      description: 'اشتروا منتجًا من Vanidel وحاولوا الفوز بقسيمة شراء بقيمة 10 000 دج.',
    },
    consents: {
      regulation: 'أوافق على نظام المسابقة.',
      dataProcessing:
        'أوافق على أن تجمع Vanidel ومزوّدوها المعتمدون بياناتي الشخصية (الاسم واللقب، رقم ' +
        'الهاتف، البريد الإلكتروني والولاية) وتعالجها لتسيير مشاركتي في هذه المسابقة، وفي ' +
        'حال فوزي، لنشر اسمي والحرف الأول من لقبي وولايتي طوال مدة العملية، وفقًا للقانون رقم ' +
        '18-07 المعدّل والمتمّم بالقانون رقم 25-11.',
      marketing: 'أوافق على تلقي عروض Vanidel وجديدها.',
    },
    alt: { hero: 'منتجات Vanidel من تشكيلة Mix', share: 'مسابقة Vanidel تشكيلة Mix' },
  },
}

const consentSettings = [
  { type: 'regulation', required: true },
  { type: 'dataProcessing', required: true },
  { type: 'marketing', required: false },
] as const

/**
 * Development data: an admin, a commercial user and one published French/Arabic contest open for
 * four weeks, with placeholder content. Safe to run repeatedly; existing records (matched by
 * email, file name or slug) are left as they are.
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

  const { fr, ar } = content
  const hero = await ensureImage(
    payload,
    'seed-hero.png',
    { width: 1600, height: 900 },
    { fr: fr.alt.hero, ar: ar.alt.hero },
  )
  const share = await ensureImage(
    payload,
    'seed-share.png',
    { width: 1200, height: 630 },
    { fr: fr.alt.share, ar: ar.alt.share },
  )

  const contest = await payload.create({
    collection: 'contests',
    locale: 'fr',
    data: {
      slug: seedContestSlug,
      status: 'draft',
      startAt: new Date(now.getTime() - day).toISOString(),
      endAt: new Date(now.getTime() + 28 * day).toISOString(),
      title: fr.title,
      description: text(fr.description),
      steps: fr.steps.map((step) => ({ text: step })),
      seo: fr.seo,
      heroMedia: hero.id,
      shareMedia: share.id,
      prizes: [{ ...fr.prize, quantity: 4 }],
      form: { email: 'optional', wilayaRequired: true },
      entryLimitPerPhone: 1,
      draw: { periodDays: 7, winnersPerDraw: 1, poolScope: 'period' },
      consents: consentSettings.map(({ type, required }) => ({
        type,
        required,
        label: fr.consents[type],
      })),
    },
  })

  // Array rows keep their IDs across locales, so each Arabic text lands on the same row.
  await payload.update({
    collection: 'contests',
    id: contest.id,
    locale: 'ar',
    data: {
      title: ar.title,
      description: text(ar.description),
      steps: (contest.steps ?? []).map((step, index) => ({ ...step, text: ar.steps[index] })),
      seo: ar.seo,
      prizes: (contest.prizes ?? []).map((prize) => ({ ...prize, ...ar.prize })),
      consents: (contest.consents ?? []).map((consent) => ({
        ...consent,
        label: ar.consents[consent.type],
      })),
    },
  })

  return payload.update({ collection: 'contests', id: contest.id, data: { status: 'published' } })
}
