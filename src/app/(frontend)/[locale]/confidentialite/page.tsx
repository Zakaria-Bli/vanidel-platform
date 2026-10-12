import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { LegalPage } from '@/components/shared/LegalPage'
import type { Locale } from '@/i18n/config'

// Rendered per request, never at build (CI builds have no database); the text is cached.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('footer')
  return { title: t('privacy') }
}

export default async function PrivacyPage({ params }: PageProps<'/[locale]/confidentialite'>) {
  const { locale } = await params
  return <LegalPage locale={locale as Locale} field="privacyText" />
}
