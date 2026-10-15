import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ar } from '@payloadcms/translations/languages/ar'
import { en } from '@payloadcms/translations/languages/en'
import { fr } from '@payloadcms/translations/languages/fr'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { defaultLocale, localeMetadata, locales } from './i18n/config'
import { env } from './lib/env'
import { storagePlugins } from './lib/storage'
import { migrations } from './migrations'
import { ConsentRecords } from './payload/collections/ConsentRecords'
import { Contacts } from './payload/collections/Contacts'
import { CampaignLinks } from './payload/collections/CampaignLinks'
import { Contests } from './payload/collections/Contests'
import { Draws } from './payload/collections/Draws'
import { Media } from './payload/collections/Media'
import { Participations } from './payload/collections/Participations'
import { Tickets } from './payload/collections/Tickets'
import { Users } from './payload/collections/Users'
import { Winners } from './payload/collections/Winners'
import { Settings } from './payload/globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // Each user picks light, dark or automatic in their account. Colours and fonts: custom.scss.
    theme: 'all',
    meta: {
      // Payload adds the space before it.
      titleSuffix: '· Vanidel',
      // Admin pages are never shared; this also turns off Payload's /api/og image generator. The
      // texts replace Payload's own ("Payload App") in case a link is pasted somewhere.
      defaultOGImageType: 'off',
      description: 'Espace équipe des concours Vanidel.',
      openGraph: { siteName: 'Vanidel', description: 'Espace équipe des concours Vanidel.' },
      icons: {
        icon: [
          { url: '/favicon.ico', sizes: '48x48' },
          { url: '/brand/icons/favicon.svg', type: 'image/svg+xml' },
        ],
        apple: '/brand/icons/apple-touch-icon.png',
      },
    },
    components: {
      graphics: {
        Logo: '/payload/components/brand/AdminLogo#AdminLogo',
        Icon: '/payload/components/brand/AdminIcon#AdminIcon',
      },
      providers: ['/payload/components/brand/AdminFonts#AdminFonts'],
      beforeLogin: ['/payload/components/brand/LoginIntro#LoginIntro'],
      afterLogin: ['/payload/components/brand/LoginFooter#LoginFooter'],
      beforeNavLinks: ['/payload/components/brand/ViewSiteLink#ViewSiteLink'],
      // Above Payload's collection cards, which stay. Not the experimental `admin.dashboard` widgets.
      beforeDashboard: ['/payload/components/dashboard/VanidelDashboard#VanidelDashboard'],
    },
  },
  collections: [
    Contests,
    CampaignLinks,
    Draws,
    Winners,
    Participations,
    Tickets,
    Contacts,
    ConsentRecords,
    Media,
    Users,
  ],
  globals: [Settings],
  editor: lexicalEditor(),
  // Admin interface languages; each admin user picks theirs in their account settings.
  i18n: {
    supportedLanguages: { fr, ar, en },
    fallbackLanguage: 'fr',
  },
  // Editorial content (contest titles, descriptions, …) is localized with `localized: true`
  // fields; interface strings live in src/i18n/messages. Both follow src/i18n/config.ts.
  localization: {
    locales: locales.map((code) => ({
      code,
      label: localeMetadata[code].nativeName,
      rtl: localeMetadata[code].direction === 'rtl',
    })),
    defaultLocale,
    fallback: true,
  },
  secret: env.PAYLOAD_SECRET,
  // Applies to REST uploads; the participation service enforces its own ticket limit.
  upload: {
    limits: { fileSize: 10 * 1024 * 1024 },
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Applied on startup when NODE_ENV=production; development and tests use schema push.
    prodMigrations: migrations,
  }),
  sharp,
  plugins: [...storagePlugins()],
})
