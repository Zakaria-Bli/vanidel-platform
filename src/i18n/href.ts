/**
 * The current page's path with its query string, e.g. for the language switcher, so campaign
 * parameters (utm_source, utm_campaign…) survive a change of language.
 */
export function withSearch(pathname: string, search: URLSearchParams | string): string {
  const query = search.toString().replace(/^\?/, '')
  return query ? `${pathname}?${query}` : pathname
}
