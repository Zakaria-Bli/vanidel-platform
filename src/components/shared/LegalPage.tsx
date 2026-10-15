import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/config'
import { getCachedSettings } from '@/modules/contests/queries/cached'

import { Container } from './Container'
import { RichText } from './RichText'

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
    <Container size="prose" className="flex flex-col gap-block py-section">
      <h1>{t(field === 'privacyText' ? 'privacy' : 'legal')}</h1>
      {text ? <RichText data={text} /> : <p>{t('notYetAvailable')}</p>}
    </Container>
  )
}
