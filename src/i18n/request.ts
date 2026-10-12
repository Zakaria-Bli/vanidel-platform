import { notFound } from 'next/navigation'
import { locale as localeParam } from 'next/root-params'
import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { routing } from './routing'

export default getRequestConfig(async ({ locale: override }) => {
  // An explicit locale (e.g. `getTranslations({ locale })`) wins over the `[locale]` segment.
  const requested = override ?? (await localeParam())

  // `[locale]` also matches unknown paths such as `/unknown.txt`; render those as a 404 for every
  // page, not just the layout (layouts and pages render in parallel).
  if (!hasLocale(routing.locales, requested)) notFound()

  return {
    locale: requested,
    messages: (await import(`./messages/${requested}.json`)).default,
  }
})
