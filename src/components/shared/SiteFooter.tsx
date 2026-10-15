import { getLocale, getTranslations } from 'next-intl/server'

import { CookieSettingsButton } from '@/components/analytics/Tracking'
import type { Locale } from '@/i18n/config'
import { Link } from '@/i18n/navigation'

import { BrandLogo, Slogan } from './BrandLogo'
import { Container } from './Container'
import { SocialLinks } from './SocialLinks'

const linkClass = 'underline-offset-4 hover:underline'

/**
 * A red band like the charter's closing banner: the white logo and slogan, the social accounts,
 * then the legal links. White on red is 4.64:1, enough for text of any size; focus rings turn
 * white here, as the blue ones would not show on red.
 */
export async function SiteFooter() {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations('footer')

  return (
    <footer className="bg-primary text-primary-foreground [--ring:var(--primary-foreground)]">
      <Container className="flex flex-col gap-8 py-10 md:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6 sm:gap-8">
            <BrandLogo tone="white" className="h-16 w-auto sm:h-20" />
            <Slogan tone="white" className="h-11 w-auto sm:h-13" />
          </div>
          <SocialLinks locale={locale} />
        </div>
        <div className="flex flex-col gap-4 border-t border-primary-foreground/30 pt-6 text-small md:flex-row md:items-center md:justify-between">
          <nav aria-label={t('legalNav')}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              <li>
                <Link href="/mentions-legales" className={linkClass}>
                  {t('legal')}
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className={linkClass}>
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <CookieSettingsButton label={t('cookies')} className={linkClass} />
              </li>
            </ul>
          </nav>
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </Container>
    </footer>
  )
}
