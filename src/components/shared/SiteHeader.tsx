import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

import { BrandLogo } from './BrandLogo'
import { Container } from './Container'
import { HeaderNav } from './HeaderNav'
import { LocaleSwitcher } from './LocaleSwitcher'

/** The logo, the two contest lists (from tablets up) and the language switcher. */
export async function SiteHeader() {
  const t = await getTranslations('header')

  return (
    <header className="border-b bg-background">
      <Container className="flex h-16 items-center gap-6 md:h-18">
        <Link href="/concours" className="shrink-0 rounded-md">
          <BrandLogo alt={t('home')} priority className="h-11 w-auto md:h-12" />
        </Link>
        <HeaderNav
          label={t('nav')}
          links={[
            { href: '/concours', label: t('current') },
            { href: '/concours/archives', label: t('past') },
          ]}
        />
        <div className="ms-auto">
          <LocaleSwitcher />
        </div>
      </Container>
    </header>
  )
}
