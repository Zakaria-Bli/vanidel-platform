export const locales = ['fr', 'ar'] as const

export type Locale = (typeof locales)[number]

export type Direction = 'ltr' | 'rtl'

export const defaultLocale: Locale = 'fr'

export function getDirection(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr'
}
