import { getTranslations } from 'next-intl/server'

import { CookieSettingsButton } from '@/components/analytics/Tracking'
import { Link } from '@/i18n/navigation'

import { Container } from './Container'

export async function SiteFooter() {
  const t = await getTranslations('footer')
  return (
    <footer className="border-t bg-muted">
      <Container className="flex flex-wrap gap-x-6 gap-y-2 py-6 text-sm text-muted-foreground">
        <Link href="/mentions-legales" className="underline-offset-4 hover:underline">
          {t('legal')}
        </Link>
        <Link href="/confidentialite" className="underline-offset-4 hover:underline">
          {t('privacy')}
        </Link>
        <CookieSettingsButton label={t('cookies')} />
      </Container>
    </footer>
  )
}
