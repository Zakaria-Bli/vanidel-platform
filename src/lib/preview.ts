import { draftMode, headers } from 'next/headers'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'
import config from '@/payload.config'

/** Back-office users, who may preview drafts. */
export async function staffUser(requestHeaders: Headers): Promise<User | null> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: requestHeaders })
  return user?.collection === 'users' && (user.role === 'admin' || user.role === 'commercial')
    ? (user as User)
    : null
}

/**
 * Whether this request previews drafts: draft mode is on (set by /api/preview) and the visitor is
 * still signed in as staff. Checked on every request, so a leftover cookie shows nothing private
 * once the session ends.
 */
export async function isStaffPreview(): Promise<boolean> {
  if (!(await draftMode()).isEnabled) return false
  return (await staffUser(await headers())) !== null
}
