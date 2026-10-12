import { Alexandria, Montserrat, Poppins } from 'next/font/google'
import localFont from 'next/font/local'

// Latin headings.
export const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

// Latin body.
export const montserrat = Montserrat({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-montserrat',
  display: 'swap',
})

// Arabic headings.
export const alexandria = Alexandria({
  subsets: ['arabic'],
  variable: '--font-alexandria',
  display: 'swap',
  // Only used on Arabic pages; avoid preloading it on French ones (see montserratArabic).
  preload: false,
})

// Arabic body. Not on Google Fonts, so it is self-hosted from ./montserrat-arabic.
export const montserratArabic = localFont({
  src: [
    { path: './montserrat-arabic/Montserrat-Arabic-Regular.woff2', weight: '400' },
    { path: './montserrat-arabic/Montserrat-Arabic-Medium.woff2', weight: '500' },
    { path: './montserrat-arabic/Montserrat-Arabic-SemiBold.woff2', weight: '600' },
    { path: './montserrat-arabic/Montserrat-Arabic-Bold.woff2', weight: '700' },
  ],
  variable: '--font-montserrat-arabic',
  display: 'swap',
  // Arabic pages swap these fonts in after first paint. next/font preload lists are static per
  // route entry and both locales share the `[locale]` layout, so `preload: true` would also
  // fetch them on French pages. Revisit if Arabic first paint matters more than that cost.
  preload: false,
})

export const fontVariables = [
  poppins.variable,
  montserrat.variable,
  alexandria.variable,
  montserratArabic.variable,
].join(' ')
