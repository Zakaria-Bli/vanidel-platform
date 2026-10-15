import type { I18nClient } from '@payloadcms/translations'
import Image from 'next/image'

import markSquare from '@/assets/brand/logo/vanidel-mark-red-square.svg'

import './brand.scss'

/**
 * The mark at the start of the breadcrumb, linking to the dashboard. Red in both themes: 3.8:1 on the
 * dark background, above the 3:1 graphics need. It is the link's only content, so it names it.
 */
export function AdminIcon({ i18n }: { i18n: I18nClient }) {
  return <Image src={markSquare} alt={i18n.t('general:dashboard')} className="vd-admin-icon" />
}
