import type { Config } from 'payload'
import { describe, expect, it } from 'vitest'

import { parseEnv } from '@/lib/env'

import { storagePlugins } from '.'

const base = {
  DATABASE_URL: 'postgresql://payload:secret@127.0.0.1:5432/vanidel',
  PAYLOAD_SECRET: 'x'.repeat(32),
}

async function uploadConfigs(source: Record<string, string>) {
  let config = {
    collections: [
      { slug: 'media', upload: true, fields: [] },
      { slug: 'tickets', upload: true, fields: [] },
    ],
  } as unknown as Config
  for (const plugin of storagePlugins(parseEnv({ ...base, ...source }))) {
    config = await plugin(config)
  }
  return Object.fromEntries(
    (config.collections ?? []).map(({ slug, upload, fields }) => [slug, { upload, fields }]),
  )
}

const usesLocalDisk = (upload: unknown) =>
  upload === true || !(upload as { disableLocalStorage?: boolean }).disableLocalStorage

describe('storagePlugins', () => {
  it('keeps uploads on local disk without S3 settings, with the same fields', async () => {
    const { media, tickets } = await uploadConfigs({})

    for (const collection of [media, tickets]) {
      expect(usesLocalDisk(collection.upload)).toBe(true)
      expect(collection.fields.map((field) => 'name' in field && field.name)).toContain('prefix')
    }
  })

  it('stores media and tickets in S3 when configured', async () => {
    const { media, tickets } = await uploadConfigs({
      S3_ENDPOINT: 'http://127.0.0.1:8333',
      S3_ACCESS_KEY_ID: 'key',
      S3_SECRET_ACCESS_KEY: 'secret',
      S3_BUCKET_PUBLIC: 'vanidel-public',
      S3_BUCKET_PRIVATE: 'vanidel-private',
    })

    for (const collection of [media, tickets]) {
      expect(usesLocalDisk(collection.upload)).toBe(false)
      // Files are still served by Payload, so collection read access applies to downloads.
      expect(collection.upload).not.toMatchObject({ disablePayloadAccessControl: true })
    }
  })
})
