'use client'

import { useLocale } from 'next-intl'

import { buttonVariants } from '@/components/ui/button'
import { locales, localeMetadata } from '@/i18n/config'
import { Link, usePathname } from '@/i18n/navigation'

/**
 * Links to the current page in every other locale. The visible native name is the accessible
 * name, so `lang` is set on the link for correct pronunciation.
 */
export function LocaleSwitcher() {
  const current = useLocale()
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1">
      {locales
        .filter((code) => code !== current)
        .map((code) => (
          <Link
            key={code}
            href={pathname}
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
