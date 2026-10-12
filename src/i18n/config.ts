// Single source of truth for supported locales. Routing, the proxy, Payload localization and the
// language switcher all derive from this file, so it must stay free of next-intl and Payload imports.

export const locales = ['fr', 'ar'] as const

export type Locale = (typeof locales)[number]

export type Direction = 'ltr' | 'rtl'

export const defaultLocale: Locale = 'fr'

interface LocaleMetadata {
  /** English name, e.g. for the Payload admin. */
  name: string
  /** Name in the language itself, shown in the language switcher. */
  nativeName: string
  direction: Direction
}

// `Record<Locale, …>` makes adding a locale to `locales` a type error until it is described here.
export const localeMetadata: Record<Locale, LocaleMetadata> = {
  fr: { name: 'French', nativeName: 'Français', direction: 'ltr' },
  ar: { name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
}

export function getDirection(locale: Locale): Direction {
  return localeMetadata[locale].direction
}
