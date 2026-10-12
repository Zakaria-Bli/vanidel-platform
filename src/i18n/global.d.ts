import type { Locale } from './config'
import type messages from './messages/fr.json'

// Type-checks translation keys and locale arguments across the app. `fr` is the reference shape;
// key parity with the other locales is enforced by src/tests/int/i18n.int.spec.ts.
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: typeof messages
  }
}
