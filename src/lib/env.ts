import { z } from 'zod'

const s3Keys = [
  'S3_ENDPOINT',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'S3_BUCKET_PUBLIC',
  'S3_BUCKET_PRIVATE',
] as const

const optional = z.string().trim().min(1).optional()

function envSchema(source: Record<string, string | undefined>) {
  // `next build` loads the config to prerender but stores no files, so it does not need storage.
  const isProductionRuntime =
    source.NODE_ENV === 'production' && source.NEXT_PHASE !== 'phase-production-build'

  return z
    .object({
      DATABASE_URL: z
        .url()
        .refine((value) => ['postgres:', 'postgresql:'].includes(new URL(value).protocol), {
          message: 'DATABASE_URL must be a PostgreSQL connection URL',
        }),
      PAYLOAD_SECRET: z.string().min(32, 'PAYLOAD_SECRET must contain at least 32 characters'),
      // S3-compatible object storage (SeaweedFS). Unset in development and tests, where uploads
      // stay on local disk; required in production.
      S3_ENDPOINT: z.url().optional(),
      S3_REGION: z.string().trim().min(1).default('us-east-1'),
      S3_ACCESS_KEY_ID: optional,
      S3_SECRET_ACCESS_KEY: optional,
      S3_BUCKET_PUBLIC: optional,
      S3_BUCKET_PRIVATE: optional,
    })
    .superRefine((value, ctx) => {
      const missing = s3Keys.filter((key) => !value[key])
      const partial = missing.length > 0 && missing.length < s3Keys.length
      if (partial || (isProductionRuntime && missing.length > 0)) {
        for (const key of missing) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: partial
              ? `${key} is required when any S3 setting is set`
              : `${key} is required in production`,
          })
        }
      }
    })
}

export type Env = ReturnType<typeof parseEnv>

export function parseEnv(source: Record<string, string | undefined>) {
  return envSchema(source).parse({
    DATABASE_URL: source.DATABASE_URL,
    PAYLOAD_SECRET: source.PAYLOAD_SECRET,
    // Blank values (e.g. `S3_ENDPOINT=` copied from .env.example) count as unset.
    ...Object.fromEntries(
      [...s3Keys, 'S3_REGION'].map((key) => [key, source[key]?.trim() || undefined]),
    ),
  })
}

export const env = parseEnv(process.env)
