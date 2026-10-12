import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { defaultLocale, localeMetadata, locales } from './i18n/config'
import { env } from './lib/env'
import { migrations } from './migrations'
import { Media } from './payload/collections/Media'
import { Users } from './payload/collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
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
  plugins: [],
})
