import type { DefaultServerCellComponentProps } from 'payload'

import { wilayaLabel, wilayas } from '@/modules/audience/domain/wilayas'

/** "16 - Alger" (or the Arabic name in the Arabic admin) instead of the stored code. */
export function WilayaCell({ cellData, i18n }: DefaultServerCellComponentProps) {
  const wilaya = wilayas.find(({ code }) => code === cellData)
  if (!wilaya) return <>{typeof cellData === 'string' ? cellData : null}</>
  return <>{wilayaLabel(wilaya, i18n.language === 'ar' ? 'ar' : 'fr')}</>
}
