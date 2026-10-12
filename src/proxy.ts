import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

// Redirects unprefixed public paths to the visitor's locale (NEXT_LOCALE cookie, then
// Accept-Language, then the default). This is what serves the locale-independent QR entry
// /concours/{slug} (SPECIFICATION §17.1).
export default createMiddleware(routing)

export const config = {
  // Only the public frontend is localized. Skip Payload's API and admin (whole segments, so a
  // future /administration page is still localized), Next.js internals, and files with an extension.
  matcher: ['/((?!(?:api|admin|_next|_vercel)(?:/|$)|.*\\..*).*)'],
}
