import type { I18nClient } from '@payloadcms/translations'

import { brandMessages } from './brandMessages'

import './brand.scss'

/** Above the login form: what this space is for, in the admin language. */
export function LoginIntro({ i18n }: { i18n: I18nClient }) {
  const t = brandMessages(i18n.language)
  return (
    <div className="vd-login-intro">
      <h1 className="vd-login-intro__title">{t.loginTitle}</h1>
      <p className="vd-login-intro__lead">{t.loginLead}</p>
    </div>
  )
}
