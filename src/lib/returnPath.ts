/**
 * The path of `referer` to send a visitor back to on this site, or `/`. Only a single-slash path
 * is kept: `//host/…` (or `/\host/…`, which browsers read the same way) in a Location header
 * leads to another site.
 */
export function returnPath(referer: string | null): string {
  if (!referer) return '/'
  let url: URL
  try {
    url = new URL(referer)
  } catch {
    return '/'
  }
  const path = url.pathname
  return /^\/(?![/\\])/.test(path) && !path.includes('\\') ? path : '/'
}
