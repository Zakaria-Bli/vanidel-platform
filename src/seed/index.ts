// Development seed: `pnpm seed`. See src/seed/seed.ts for what it creates.
import { getPayload } from 'payload'

import config from '@/payload.config'

import { seed } from './seed'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed: NODE_ENV is production.')
  process.exit(1)
}

const adminPassword = process.env.SEED_ADMIN_PASSWORD
const commercialPassword = process.env.SEED_COMMERCIAL_PASSWORD
if (!adminPassword || !commercialPassword) {
  console.error('Set SEED_ADMIN_PASSWORD and SEED_COMMERCIAL_PASSWORD (see .env.example).')
  process.exit(1)
}

const payload = await getPayload({ config })
try {
  const contest = await seed(payload, { adminPassword, commercialPassword })
  payload.logger.info(
    `Seeded admin@vanidel.local, commercial@vanidel.local and /concours/${contest.slug}`,
  )
} finally {
  await payload.destroy()
}
process.exit(0)
