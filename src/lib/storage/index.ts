import { s3Storage } from '@payloadcms/storage-s3'
import type { Plugin } from 'payload'

import { env as processEnv, type Env } from '@/lib/env'

/**
 * Upload storage on SeaweedFS through its S3 API (ARCHITECTURE §9): campaign media in the public
 * bucket, receipt photos in the private one. Files are still served through Payload
 * (/api/{collection}/file/*), so collection read access applies to every download; tickets are
 * never exposed through a bucket URL. Without S3 settings (development, tests) uploads stay on
 * local disk.
 */
export function storagePlugins(env: Env = processEnv): Plugin[] {
  const enabled = Boolean(env.S3_ENDPOINT)
  const config = {
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? '',
    },
  }
  // Keeps the plugin's `prefix` field in the schema whether or not S3 is configured, so
  // migrations and generated types do not depend on the environment.
  const alwaysInsertFields = true

  return [
    s3Storage({
      enabled,
      alwaysInsertFields,
      clientCacheKey: 's3:public',
      bucket: env.S3_BUCKET_PUBLIC ?? '',
      config,
      collections: { media: true },
    }),
    s3Storage({
      enabled,
      alwaysInsertFields,
      clientCacheKey: 's3:private',
      bucket: env.S3_BUCKET_PRIVATE ?? '',
      config,
      collections: { tickets: true },
    }),
  ]
}
