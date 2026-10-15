import type { I18nClient } from '@payloadcms/translations'
import { ExternalLink } from 'lucide-react'

import { brandMessages } from './brandMessages'

import './brand.scss'

/** At the top of the navigation: the public contest list, in a new tab. */
export function ViewSiteLink({ i18n }: { i18n: I18nClient }) {
  const t = brandMessages(i18n.language)
  return (
    <a className="vd-view-site" href="/fr/concours" target="_blank" rel="noopener">
      {t.viewSite}
      <ExternalLink className="vd-view-site__icon" aria-hidden size={14} />
      <span className="sr-only">{t.newTab}</span>
    </a>
  )
}
