import type { I18nClient } from '@payloadcms/translations'

import { Slogan } from '@/components/shared/BrandLogo'

import { brandMessages } from './brandMessages'

import './brand.scss'

/** Below the login form: the slogan artwork, then who to ask for an account. */
export function LoginFooter({ i18n }: { i18n: I18nClient }) {
  const t = brandMessages(i18n.language)
  return (
    <div className="vd-login-footer">
      <Slogan tone="red" className="vd-login-footer__slogan vd-theme-light" />
      <Slogan tone="white" className="vd-login-footer__slogan vd-theme-dark" />
      <p className="vd-login-footer__access">{t.noAccess}</p>
    </div>
  )
}
