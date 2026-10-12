/** Text of a Lexical rich-text value, so an editor-emptied field counts as missing. */
function richText(value: { root?: unknown }): string {
  const walk = (node: unknown): string => {
    if (typeof node !== 'object' || node === null) return ''
    const { text, children } = node as { text?: unknown; children?: unknown }
    const own = typeof text === 'string' ? text : ''
    return own + (Array.isArray(children) ? children.map(walk).join('') : '')
  }
  return walk(value.root)
}

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (typeof value === 'object' && 'root' in value) return richText(value).trim() === ''
  return false
}

function valueAt(doc: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    return typeof node === 'object' && node !== null
      ? (node as Record<string, unknown>)[key]
      : undefined
  }, doc)
}

/**
 * Localized fields that are empty in some locale, as `path (locale)`. `doc` is a document read with
 * `locale: 'all'`, where each localized field holds `{ fr: …, ar: … }`. Used to stop a contest going
 * public half translated, which `fallback: true` would otherwise paper over with French.
 */
export function missingTranslations(
  doc: unknown,
  paths: readonly string[],
  locales: readonly string[],
): string[] {
  return paths.flatMap((path) => {
    const byLocale = valueAt(doc, path)
    return locales
      .filter((locale) => isBlank(valueAt(byLocale, locale)))
      .map((locale) => `${path} (${locale})`)
  })
}
