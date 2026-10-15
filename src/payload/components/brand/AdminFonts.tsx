import type { ReactNode } from 'react'

import { fontBody, fontBodyArabic, fontDisplay, fontDisplayArabic } from '@/lib/fonts'

/*
 * The brand fonts in the admin, from the same next/font objects as the site, so changing a font in
 * src/lib/fonts/index.ts changes both. Payload's generated layout (src/app/(payload)/layout.tsx)
 * must not be edited, so the fonts' classes cannot go on <html>: this provider writes their family
 * names into variables instead, and custom.scss maps them onto Payload's `--font-body` and the
 * headings, Arabic first when the admin language is Arabic.
 */

interface LoadedFont {
  style: { fontFamily: string }
}

/**
 * One font stack from several next/font fonts: the fonts first, then their metric-matched fallbacks.
 * The fallbacks are local Arial, which has Arabic letters, so with the Latin font's fallback before
 * the Arabic font, Arabic text in a French screen would be set in Arial.
 */
function stack(...fonts: LoadedFont[]): string {
  const names = fonts.flatMap(({ style }) => style.fontFamily.split(',').map((name) => name.trim()))
  const fallbacks = names.filter((name) => name.includes('Fallback'))
  return [...names.filter((name) => !fallbacks.includes(name)), ...fallbacks].join(', ')
}

const fontVariables = `:root {
  --vd-font-text: ${stack(fontBody, fontBodyArabic)};
  --vd-font-text-ar: ${stack(fontBodyArabic, fontBody)};
  --vd-font-title: ${stack(fontDisplay, fontDisplayArabic)};
  --vd-font-title-ar: ${stack(fontDisplayArabic, fontDisplay)};
}`

export function AdminFonts({ children }: { children?: ReactNode }) {
  return (
    <>
      {/* React hoists it into <head> once, whatever the page. */}
      <style href="vanidel-admin-fonts" precedence="default">
        {fontVariables}
      </style>
      {children}
    </>
  )
}
