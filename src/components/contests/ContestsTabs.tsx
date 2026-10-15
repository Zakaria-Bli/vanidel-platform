import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

/**
 * Switches between current and past contests: two pages, so links with `aria-current` rather than
 * ARIA tabs, drawn as a segmented control.
 */
export async function ContestsTabs({ active }: { active: 'current' | 'past' }) {
  const t = await getTranslations('contests.tabs')
  const tabs = [
    { key: 'current', href: '/concours', label: t('current') },
    { key: 'past', href: '/concours/archives', label: t('past') },
  ] as const

  return (
    <nav aria-label={t('label')}>
      <ul className="inline-flex gap-1 rounded-full bg-muted p-1">
        {tabs.map(({ key, href, label }) => (
          <li key={key}>
            <Link
              href={href}
              aria-current={key === active ? 'page' : undefined}
              className={cn(
                'inline-flex h-11 items-center rounded-full px-5 text-label transition-colors duration-150',
                key === active
                  ? 'bg-background text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
