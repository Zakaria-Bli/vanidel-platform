import { RichText } from '@payloadcms/richtext-lexical/react'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/config'
import { getCachedSettings } from '@/modules/contests/queries/cached'

import { Container } from './Container'

/** A legal text from the settings (privacy policy, legal notice), in the visitor's language. */
export async function LegalPage({
  locale,
  field,
}: {
  locale: Locale
  field: 'privacyText' | 'legalText'
}) {
  const t = await getTranslations('footer')
  const settings = await getCachedSettings(locale)
  const text = settings[field]

  return (
    <Container size="narrow" className="flex flex-col gap-6 py-10">
      <h1>{t(field === 'privacyText' ? 'privacy' : 'legal')}</h1>
      {text ? <RichText data={text} /> : <p>{t('notYetAvailable')}</p>}
    </Container>
  )
}
