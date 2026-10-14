import { describe, expect, it } from 'vitest'

import { duplicateSlug, duplicateSlugPrefix } from './duplicate'

describe('duplicateSlug', () => {
  it('names the first copy, then numbers the next ones', () => {
    expect(duplicateSlug('ete-2026', new Set())).toBe('ete-2026-copie')
    expect(duplicateSlug('ete-2026', new Set(['ete-2026-copie']))).toBe('ete-2026-copie-2')
    expect(duplicateSlug('ete-2026', new Set(['ete-2026-copie', 'ete-2026-copie-2']))).toBe(
      'ete-2026-copie-3',
    )
  })

  it('does not stack suffixes when duplicating a copy', () => {
    expect(duplicateSlug('ete-copie-2', new Set(['ete-copie', 'ete-copie-2']))).toBe('ete-copie-3')
    expect(duplicateSlugPrefix('ete-copie-2')).toBe('ete-copie')
  })
})
