import { describe, expect, it } from 'vitest'

import { missingTranslations } from './translations'

const paragraph = (text: string) => ({
  root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text }] }] },
})

describe('missingTranslations', () => {
  const paths = ['title', 'description', 'seo.title'] as const
  const locales = ['fr', 'ar'] as const

  it('returns nothing when every locale is filled', () => {
    const doc = {
      title: { fr: 'Concours', ar: 'مسابقة' },
      description: { fr: paragraph('Gagnez'), ar: paragraph('اربح') },
      seo: { title: { fr: 'Concours', ar: 'مسابقة' } },
    }

    expect(missingTranslations(doc, paths, locales)).toEqual([])
  })

  it('reports empty, blank and absent values per locale', () => {
    const doc = {
      title: { fr: 'Concours', ar: '   ' },
      description: { fr: paragraph('Gagnez'), ar: paragraph('') },
      seo: { title: { fr: 'Concours' } },
    }

    expect(missingTranslations(doc, paths, locales)).toEqual([
      'title (ar)',
      'description (ar)',
      'seo.title (ar)',
    ])
  })

  it('reports a field missing entirely in every locale', () => {
    expect(missingTranslations({}, ['title'], locales)).toEqual(['title (fr)', 'title (ar)'])
  })
})
