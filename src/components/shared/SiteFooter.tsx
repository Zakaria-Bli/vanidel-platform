import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'

import chef from '@/assets/brand/photos/vanidel-chef-ambassador.png'

import { CookieSettingsButton } from '@/components/analytics/Tracking'
import type { Locale } from '@/i18n/config'
import { Link } from '@/i18n/navigation'

import { BrandLogo, Slogan } from './BrandLogo'
import { Container } from './Container'
import { SocialLinks } from './SocialLinks'

const linkClass = 'underline-offset-4 hover:underline'

/**
 * A red band like the charter's closing banner: the white logo, slogan and social accounts, with
 * the chef ambassador opposite, then the legal links. White on red is 4.64:1, enough for text of
 * any size; focus rings turn white here, as the blue ones would not show on red.
 */
export async function SiteFooter() {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations('footer')

  return (
    <footer className="bg-primary text-primary-foreground [--ring:var(--primary-foreground)]">
      <Container className="flex flex-col gap-8 py-10 md:py-12">
        {/*
         * The chef stays on the physical right in both languages, pointing at the logo: the photo
         * is never mirrored (the logo on his apron would read backwards). He stands on the rule
         * above the legal links, in a cream arch so his red apron does not melt into the band.
         */}
        <div className="flex items-end justify-between gap-4 rtl:flex-row-reverse">
          <div className="flex min-w-0 flex-col items-start gap-6 sm:gap-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
              <BrandLogo tone="white" className="h-14 w-auto sm:h-20" />
              <Slogan tone="white" className="h-9 w-auto sm:h-13" />
            </div>
            <SocialLinks locale={locale} />
          </div>
          <div className="relative -mb-8 h-40 w-32 shrink-0 sm:h-52 sm:w-44 md:h-60 md:w-52">
            <div
              aria-hidden
              className="absolute inset-x-0 top-5 bottom-0 rounded-t-full bg-brand-cream"
            />
            <Image
              src={chef}
              alt=""
              sizes="(min-width: 768px) 320px, (min-width: 640px) 280px, 216px"
              className="absolute right-0 bottom-0 h-[112%] w-auto max-w-none"
            />
          </div>
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
