import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import React from 'react'

import { Tracking } from '@/components/analytics/Tracking'
import { SiteFooter } from '@/components/shared/SiteFooter'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { DirectionProvider } from '@/components/ui/direction'
import { getDirection } from '@/i18n/config'
import { routing } from '@/i18n/routing'
import { env } from '@/lib/env'
import { fontVariables } from '@/lib/fonts'
import { defaultShareImage } from '@/lib/media'
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations('metadata')
  // Pages that set their own openGraph or twitter replace these whole (metadata merges shallowly).
  const images = [{ ...defaultShareImage, alt: t('title') }]
  return {
    // Resolves relative URLs such as share images into the absolute ones social networks need.
    metadataBase: new URL(env.SITE_URL),
    title: { default: t('title'), template: `%s · ${t('title')}` },
    description: t('description'),
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '48x48' },
        { url: '/brand/icons/favicon.svg', type: 'image/svg+xml' },
      ],
      apple: '/brand/icons/apple-touch-icon.png',
    },
    // Open Graph wants language_TERRITORY.
    openGraph: { siteName: 'Vanidel', type: 'website', locale: `${locale}_DZ`, images },
    twitter: { card: 'summary_large_image', images },
  }
}

export default async function LocaleLayout({ children }: LayoutProps<'/[locale]'>) {
  // Resolved from the `[locale]` segment in src/i18n/request.ts, which 404s unknown locales.
  const locale = await getLocale()
  const dir = getDirection(locale)

  return (
    <html lang={locale} dir={dir} className={fontVariables}>
      {/* A full-height column, so the footer sits at the bottom of short pages too. */}
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          <DirectionProvider direction={dir}>
            <SiteHeader />
            <main className="flex flex-1 flex-col">{children}</main>
            <SiteFooter />
            <Tracking />
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
