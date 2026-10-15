import { BrandLogo } from '@/components/shared/BrandLogo'

import './brand.scss'

/**
 * The logo on the sign-in screens (login, first user, forgotten and new password): red on the light
 * card, white on the dark one. Both are rendered and CSS shows the one for the current theme, which
 * Payload may only know in the browser (the "automatic" theme).
 */
export function AdminLogo() {
  return (
    <span className="vd-admin-logo">
      <BrandLogo tone="red" className="vd-admin-logo__image vd-theme-light" priority />
      <BrandLogo tone="white" className="vd-admin-logo__image vd-theme-dark" />
    </span>
  )
}
