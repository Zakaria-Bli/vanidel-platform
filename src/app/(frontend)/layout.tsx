import type { Metadata } from 'next'
import React from 'react'

import { DirectionProvider } from '@/components/ui/direction'
import { defaultLocale, getDirection, type Locale } from '@/i18n/config'
import { fontVariables } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vanidel',
  description: 'Participez aux concours Vanidel.',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  // Locale routing is not implemented yet. When it is, resolve the request locale here
  // (e.g. from a `[locale]` segment); `lang`, `dir` and DirectionProvider all follow it.
  const locale: Locale = defaultLocale
  const dir = getDirection(locale)

  return (
    <html lang={locale} dir={dir} className={fontVariables}>
      <body>
        <DirectionProvider direction={dir}>
          <main>{children}</main>
        </DirectionProvider>
      </body>
    </html>
  )
}
