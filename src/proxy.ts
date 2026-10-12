import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'
import {
  attributionCookie,
  attributionFromSearch,
  attributionMaxAge,
  serializeAttribution,
} from './modules/analytics/domain/attribution'

// Redirects unprefixed public paths to the visitor's locale (NEXT_LOCALE cookie, then
// Accept-Language, then the default). This is what serves the locale-independent QR entry
// /concours/{slug} (SPECIFICATION §17.1).
const localize = createMiddleware(routing)

export default function proxy(request: NextRequest) {
  const response = localize(request)

  // Remember the campaign a visitor landed from, so the redirect above or a later language switch
  // cannot lose it before they submit a participation.
  const attribution = attributionFromSearch(request.nextUrl.searchParams)
  if (attribution) {
    response.cookies.set(attributionCookie, serializeAttribution(attribution), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: attributionMaxAge,
    })
  }
  return response
}

export const config = {
  // Only the public frontend is localized. Skip Payload's API and admin (whole segments, so a
  // future /administration page is still localized), Next.js internals, and files with an extension.
  matcher: ['/((?!(?:api|admin|_next|_vercel)(?:/|$)|.*\\..*).*)'],
}
