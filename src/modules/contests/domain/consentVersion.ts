import { createHash } from 'node:crypto'

import { locales, type Locale } from '@/i18n/config'

/**
 * Version of a consent text, derived from its wording in every language: it changes whenever the
 * text shown to anyone changes, and staff cannot forget to change it. Each consent record keeps the
 * version accepted, as evidence of the wording (SPECIFICATION §7.1). Surrounding spaces are not
 * wording.
 */
export function consentTextVersion(label: Partial<Record<Locale, string | null>>): string {
  const texts = locales.map((locale) => (label[locale] ?? '').trim())
  return createHash('sha256').update(JSON.stringify(texts)).digest('hex').slice(0, 8)
}
