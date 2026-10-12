import { defineRouting } from 'next-intl/routing'

import { defaultLocale, locales } from './config'

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Every public URL carries its locale, including the default one (/fr/…, /ar/…).
  // Unprefixed paths such as the printed QR entry /concours/{slug} are redirected by the proxy
  // to the visitor's locale (SPECIFICATION §17.1).
  localePrefix: 'always',
})
