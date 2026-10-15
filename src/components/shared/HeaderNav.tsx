'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

/** The header's page links, marking the current one. Phones get the page tabs instead. */
export function HeaderNav({
  label,
  links,
}: {
  label: string
  links: { href: '/concours' | '/concours/archives'; label: string }[]
}) {
  const pathname = usePathname()

  return (
    <nav aria-label={label} className="hidden md:block">
      <ul className="flex items-center gap-1">
        {links.map(({ href, label }) => {
          const current = pathname === href
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'relative inline-flex h-11 items-center rounded-lg px-3 text-label text-muted-foreground transition-colors duration-150 hover:text-foreground',
                  current &&
                    'text-foreground after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-primary',
                )}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
