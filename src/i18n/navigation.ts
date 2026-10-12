import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

// Use these instead of next/link and next/navigation for internal app links, so the locale prefix
// is applied by the routing config rather than concatenated by hand.
export const { Link, getPathname, redirect, usePathname, useRouter } = createNavigation(routing)
