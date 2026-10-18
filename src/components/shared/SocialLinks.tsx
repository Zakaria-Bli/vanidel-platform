import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/config'
import { cn } from '@/lib/utils'
import { getCachedSettings } from '@/modules/contests/queries/cached'

import { NetworkIcon, networks } from './NetworkIcon'

/**
 * Vanidel's social accounts, from Settings › Social links in the admin. Renders nothing until one
 * is entered there.
 */
export async function SocialLinks({
  locale,
  label,
  className,
}: {
  locale: Locale
  /** Shown above the icons, and nothing at all when there are none. */
  label?: string
  className?: string
}) {
  const settings = await getCachedSettings(locale)
  const links = (settings.socialLinks ?? []).filter(({ url }) => /^https?:\/\//.test(url))
  if (links.length === 0) return null
  const t = await getTranslations('footer')

  const list = (
    <ul aria-label={t('followUs')} className={cn('flex flex-wrap items-center gap-2', className)}>
      {links.map(({ id, platform, url }) => (
        <li key={id ?? url}>
          <a
            href={url}
            target="_blank"
            rel="noopener"
            className="flex size-11 items-center justify-center rounded-full border border-current/40 transition-colors duration-150 hover:bg-current/10"
          >
            <NetworkIcon platform={platform} className="size-5" />
            <span className="sr-only">{networks[platform].name}</span>
          </a>
        </li>
      ))}
    </ul>
  )
  if (!label) return list
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label">{label}</p>
      {list}
    </div>
  )
}
