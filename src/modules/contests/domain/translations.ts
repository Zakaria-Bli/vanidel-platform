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

/** Value at a dotted path such as `seo.title`, or undefined. */
export function valueAt(doc: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    return typeof node === 'object' && node !== null
      ? (node as Record<string, unknown>)[key]
      : undefined
  }, doc)
}

/**
 * Concrete paths for `path`, where `*` stands for every row of an array: `prizes.*.title` becomes
 * `prizes.0.title`, `prizes.1.title`… An empty or missing array yields no paths.
 */
function expandPath(doc: unknown, path: string): string[] {
  const walk = (node: unknown, keys: string[], prefix: string[]): string[] => {
    if (keys.length === 0) return [prefix.join('.')]
    const [key, ...rest] = keys
    if (key !== '*') return walk(valueAt(node, key), rest, [...prefix, key])
    return Array.isArray(node)
      ? node.flatMap((row, index) => walk(row, rest, [...prefix, String(index)]))
      : []
  }
  return walk(doc, path.split('.'), [])
}

/**
 * Localized fields that are empty in some locale, as `path (locale)`. `doc` is a document read with
 * `locale: 'all'`, where each localized field holds `{ fr: …, ar: … }`; `*` in a path matches every
 * array row. Used to stop a contest going public half translated, which `fallback: true` would
 * otherwise paper over with French.
 */
export function missingTranslations(
  doc: unknown,
  paths: readonly string[],
  locales: readonly string[],
): string[] {
  return paths
    .flatMap((path) => expandPath(doc, path))
    .flatMap((path) => {
      const byLocale = valueAt(doc, path)
      return locales
        .filter((locale) => isBlank(valueAt(byLocale, locale)))
        .map((locale) => `${path} (${locale})`)
    })
}
