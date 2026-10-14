import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { hasLocale } from 'next-intl'

import { getPathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { staffUser } from '@/lib/preview'
import config from '@/payload.config'

/**
 * GET /api/preview?contest={id}&locale={fr|ar}: the admin's Preview button. Staff only: turns on
 * draft mode for this browser and opens the contest page, drafts included.
 */
export async function GET(request: Request) {
  if (!(await staffUser(request.headers))) {
    return new Response('Sign in to the administration to preview contests.', { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('contest'))
  const requested = searchParams.get('locale')
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
  const payload = await getPayload({ config })
  const contest = Number.isInteger(id)
    ? await payload
        .findByID({ collection: 'contests', id, depth: 0, select: { slug: true } })
        .catch(() => null)
    : null
  if (!contest?.slug) return new Response('Contest not found.', { status: 404 })

  ;(await draftMode()).enable()
  // Built from the stored slug, never from the query, so this cannot redirect elsewhere.
  redirect(getPathname({ href: `/concours/${contest.slug}`, locale }))
}
