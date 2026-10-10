import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z
    .url()
    .refine((value) => ['postgres:', 'postgresql:'].includes(new URL(value).protocol), {
      message: 'DATABASE_URL must be a PostgreSQL connection URL',
    }),
  PAYLOAD_SECRET: z.string().min(32, 'PAYLOAD_SECRET must contain at least 32 characters'),
})

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
})
