import { Alexandria, IBM_Plex_Sans_Arabic, Jost, Libre_Franklin } from 'next/font/google'

/*
 * The four brand fonts, by role. This is the only file to change when the licensed charter fonts
 * (Futura LT Paneuropean for titles, Franklin Gothic for text) are bought for the web: replace a
 * role's loader with `localFont` from 'next/font/local', pointing at the woff2 files and keeping
 * the same `variable`. The site's CSS (src/app/(frontend)/styles/typography.css) and the admin
 * (src/payload/components/brand/AdminFonts.tsx) only read these role variables.
 *
 * Until then, free look-alikes under the SIL Open Font License (docs/brand/README.md):
 * - Jost, a Futura revival, for Latin titles.
 * - Libre Franklin, a Franklin Gothic revival, for Latin text.
 * - Alexandria, a geometric, monoline Arabic sans built like Futura, for Arabic titles.
 * - IBM Plex Sans Arabic, light and open like Franklin's Book weight, for Arabic text.
 */

export const fontDisplay = Jost({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-brand-display',
  display: 'swap',
})

export const fontBody = Libre_Franklin({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-brand-body',
  display: 'swap',
})

export const fontDisplayArabic = Alexandria({
  subsets: ['arabic'],
  variable: '--font-brand-display-ar',
  display: 'swap',
  // Arabic pages swap the Arabic fonts in after first paint. next/font preload lists are static per
  // route entry and both locales share the `[locale]` layout, so `preload: true` would also fetch
  // them on French pages. Revisit if Arabic first paint matters more than that cost.
  preload: false,
})

export const fontBodyArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-brand-body-ar',
  display: 'swap',
  preload: false,
})

export const fontVariables = [
  fontDisplay.variable,
  fontBody.variable,
  fontDisplayArabic.variable,
  fontBodyArabic.variable,
].join(' ')
