import { missingTranslations, valueAt } from './translations'

/**
 * What a contest needs before going public (USER_FLOWS §6), checked on the document read with
 * `locale: 'all'`. `required` items are also enforced when publishing; `recommended` ones are
 * not, but a contest missing them looks unfinished or cannot be run properly.
 */
export type ChecklistItemId =
  | 'translations'
  | 'steps'
  | 'consents'
  | 'dates'
  | 'hero'
  | 'regulation'
  | 'prizes'
  | 'shareImage'
  | 'seoDescription'

export interface ChecklistItem {
  id: ChecklistItemId
  level: 'required' | 'recommended'
  ok: boolean
  /** What is missing, e.g. `title (ar)` or a locale code, when it helps to say. */
  missing: string[]
}

/** Localized fields every language must fill before publishing (enforced on save too). */
export const translatedPaths = [
  'title',
  'description',
  'seo.title',
  'steps.*.text',
  'prizes.*.title',
  'consents.*.label',
] as const

/** Consents a participation cannot be lawfully recorded without. */
const requiredConsents = ['regulation', 'dataProcessing'] as const

export function publicationChecklist(
  doc: object,
  locales: readonly string[],
  now: Date = new Date(),
): ChecklistItem[] {
  const contest = doc as Record<string, unknown>
  const item = (
    id: ChecklistItemId,
    level: ChecklistItem['level'],
    missing: string[],
  ): ChecklistItem => ({ id, level, ok: missing.length === 0, missing })
  const present = (value: unknown) => value !== null && value !== undefined && value !== ''
  const rows = (path: string) => (valueAt(contest, path) as unknown[] | undefined) ?? []
  const missingLocales = (path: string) =>
    locales.filter((locale) => !present(valueAt(valueAt(contest, path), locale)))

  const consents = rows('consents') as { type?: string; required?: boolean }[]
  const missingConsents = requiredConsents.filter(
    (type) => !consents.some((consent) => consent.type === type && consent.required),
  )

  const start = Date.parse(String(contest.startAt ?? ''))
  const end = Date.parse(String(contest.endAt ?? ''))
  const dateProblems = [
    ...(Number.isNaN(start) || Number.isNaN(end) || end <= start ? ['order'] : []),
    ...(!Number.isNaN(end) && end <= now.getTime() ? ['ended'] : []),
  ]

  return [
    item('translations', 'required', missingTranslations(contest, translatedPaths, locales)),
    item('steps', 'required', rows('steps').length > 0 ? [] : ['steps']),
    item('consents', 'recommended', [...missingConsents]),
    item('dates', 'recommended', dateProblems),
    item('hero', 'recommended', present(contest.heroMedia) ? [] : ['heroMedia']),
    item('regulation', 'recommended', missingLocales('regulation')),
    item('prizes', 'recommended', rows('prizes').length > 0 ? [] : ['prizes']),
    // Link previews fall back to the hero, so either will do.
    item(
      'shareImage',
      'recommended',
      present(contest.shareMedia) || present(contest.heroMedia) ? [] : ['shareMedia'],
    ),
    item('seoDescription', 'recommended', missingLocales('seo.description')),
  ]
}
