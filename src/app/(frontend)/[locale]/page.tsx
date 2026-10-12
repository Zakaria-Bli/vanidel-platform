import { getLocale } from 'next-intl/server'

import { redirect } from '@/i18n/navigation'

// The site root is reserved for the future corporate site; until then the contest section is the
// home page (SPECIFICATION §17.1).
export default async function LocaleHomePage() {
  redirect({ href: '/concours', locale: await getLocale() })
}
