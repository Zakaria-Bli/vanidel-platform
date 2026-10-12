'use client'

import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Suspense } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { locales, localeMetadata } from '@/i18n/config'
import { withSearch } from '@/i18n/href'
import { Link, usePathname } from '@/i18n/navigation'

/**
 * Links to the current page in every other locale, keeping the query string so campaign
 * attribution (utm_*) survives a change of language. The visible native name is the accessible
 * name, so `lang` is set on the link for correct pronunciation.
 */
export function LocaleSwitcher() {
  // Search params are not known when a page is prerendered; until they are, link without them.
  return (
    <Suspense fallback={<LocaleLinks search="" />}>
      <LocaleLinksWithSearch />
    </Suspense>
  )
}

function LocaleLinksWithSearch() {
  return <LocaleLinks search={useSearchParams()} />
}

function LocaleLinks({ search }: { search: URLSearchParams | string }) {
  const current = useLocale()
  const href = withSearch(usePathname(), search)

  return (
    <div className="flex items-center gap-1">
      {locales
        .filter((code) => code !== current)
        .map((code) => (
          <Link
            key={code}
            href={href}
            locale={code}
            lang={code}
            hrefLang={code}
            dir={localeMetadata[code].direction}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            {localeMetadata[code].nativeName}
          </Link>
        ))}
    </div>
  )
}
