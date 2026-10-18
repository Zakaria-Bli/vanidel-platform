import { NextResponse, type NextRequest } from 'next/server'
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

// Payload picks the admin language from its `payload-lng` cookie (set when a user chooses a
// language in their account), then Accept-Language, then `i18n.fallbackLanguage` (fr). The team's
// browsers are often in English, so the admin ignores Accept-Language and opens in French until
// someone picks another language. Payload's own /api calls send the chosen language and are left
// alone.
function adminInFrench(request: NextRequest) {
  if (request.cookies.has('payload-lng')) return NextResponse.next()
  const headers = new Headers(request.headers)
  headers.delete('accept-language')
  return NextResponse.next({ request: { headers } })
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return adminInFrench(request)

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
  // The admin is matched separately, only to choose its language.
  matcher: ['/((?!(?:api|admin|_next|_vercel)(?:/|$)|.*\\..*).*)', '/admin/:path*'],
}
