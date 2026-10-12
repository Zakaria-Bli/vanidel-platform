import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import React from 'react'

import { DirectionProvider } from '@/components/ui/direction'
import { getDirection } from '@/i18n/config'
import { routing } from '@/i18n/routing'
import { fontVariables } from '@/lib/fonts'
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata')
  return { title: t('title'), description: t('description') }
}

export default async function LocaleLayout({ children }: LayoutProps<'/[locale]'>) {
  // Resolved from the `[locale]` segment in src/i18n/request.ts, which 404s unknown locales.
  const locale = await getLocale()
  const dir = getDirection(locale)

  return (
    <html lang={locale} dir={dir} className={fontVariables}>
      <body>
        <NextIntlClientProvider>
          <DirectionProvider direction={dir}>
            <main>{children}</main>
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
