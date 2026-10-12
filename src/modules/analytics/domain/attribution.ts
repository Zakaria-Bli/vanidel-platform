/**
 * Campaign attribution (SPECIFICATION §13.1): where a visitor came from, captured when they land
 * on a tagged URL (`/concours/{slug}?utm_source=qr…`) and kept in a cookie until they submit, so
 * the locale redirect or a language switch cannot lose it. Last touch wins.
 */
export const attributionCookie = 'vanidel_attribution'

/** 30 days: long enough to buy a product, keep the receipt and come back. */
export const attributionMaxAge = 30 * 24 * 60 * 60

export interface Attribution {
  /** Channel: `src`, else `utm_source`, lowercased (e.g. `qr`, `facebook`). */
  source: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  landedAt: string
}

const params = {
  utmSource: 'utm_source',
  utmMedium: 'utm_medium',
  utmCampaign: 'utm_campaign',
  utmContent: 'utm_content',
} as const

const maxLength = 100

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().slice(0, maxLength)
  return trimmed === '' ? undefined : trimmed
}

/** Attribution carried by a landing URL's query, or null when it carries none. */
export function attributionFromSearch(
  search: URLSearchParams,
  now: Date = new Date(),
): Attribution | null {
  const utm = Object.fromEntries(
    Object.entries(params).flatMap(([key, param]) => {
      const value = clean(search.get(param))
      return value ? [[key, value]] : []
    }),
  ) as Partial<Record<keyof typeof params, string>>
  const source = clean(search.get('src')) ?? utm.utmSource
  if (!source) return null
  return { source: source.toLowerCase(), ...utm, landedAt: now.toISOString() }
}

export function serializeAttribution(attribution: Attribution): string {
  return JSON.stringify(attribution)
}

/** Reads the cookie value back; anything malformed or tampered with is ignored. */
export function parseAttribution(value: string | undefined): Attribution | null {
  if (!value) return null
  let data: unknown
  try {
    data = JSON.parse(value)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const record = data as Record<string, unknown>
  const source = clean(record.source)
  const landedAt = clean(record.landedAt)
  if (!source || !landedAt || Number.isNaN(Date.parse(landedAt))) return null
  return {
    source: source.toLowerCase(),
    ...Object.fromEntries(
      Object.keys(params).flatMap((key) => {
        const field = clean(record[key])
        return field ? [[key, field]] : []
      }),
    ),
    landedAt,
  }
}
