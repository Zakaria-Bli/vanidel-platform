import { describe, expect, it } from 'vitest'

import { requiredRowTranslations, requiredTranslations } from '@/payload/collections/Contests'

import { publicationChecklist, translatedPaths } from './checklist'

const both = (fr: string, ar: string) => ({ fr, ar })
const now = new Date('2026-10-14T12:00:00Z')

/** A contest read with `locale: 'all'` that has everything. */
const complete = () => ({
  title: both('Grand concours', 'المسابقة الكبرى'),
  description: both('Gagnez', 'اربح'),
  seo: { title: both('Grand concours', 'المسابقة'), description: both('Desc', 'وصف') },
  steps: [{ text: both('Envoyez votre ticket.', 'أرسلوا تذكرتكم.') }],
  prizes: [{ title: both('Vélo', 'دراجة') }],
  consents: [
    { type: 'regulation', required: true, label: both('Règlement', 'النظام') },
    { type: 'dataProcessing', required: true, label: both('Données', 'البيانات') },
  ],
  heroMedia: 1,
  regulation: { fr: 2, ar: 3 },
  startAt: '2026-10-15T00:00:00Z',
  endAt: '2026-11-15T00:00:00Z',
})

const failing = (contest: Record<string, unknown>) =>
  publicationChecklist(contest, ['fr', 'ar'], now)
    .filter(({ ok }) => !ok)
    .map(({ id, missing }) => [id, missing])

describe('publicationChecklist', () => {
  it('passes a complete contest', () => {
    expect(failing(complete())).toEqual([])
  })

  it('names the missing translations', () => {
    const contest = { ...complete(), title: { fr: 'Grand concours' } }
    expect(failing(contest)).toEqual([['translations', ['title (ar)']]])
  })

  it('flags the regulation PDF and SEO description per language', () => {
    const contest = {
      ...complete(),
      regulation: { fr: 2 },
      seo: { ...complete().seo, description: { ar: 'وصف' } },
    }
    expect(failing(contest)).toEqual([
      ['regulation', ['ar']],
      ['seoDescription', ['fr']],
    ])
  })

  it('requires the regulation and data consents to be mandatory', () => {
    const contest = {
      ...complete(),
      consents: [{ type: 'regulation', required: false, label: both('R', 'ن') }],
    }
    expect(failing(contest)).toEqual([['consents', ['regulation', 'dataProcessing']]])
  })

  it('flags dates out of order or already past', () => {
    expect(failing({ ...complete(), endAt: '2026-10-01T00:00:00Z' })).toEqual([
      ['dates', ['order', 'ended']],
    ])
  })

  it('accepts the hero as share image, and flags having neither', () => {
    expect(failing({ ...complete(), heroMedia: null })).toEqual([
      ['hero', ['heroMedia']],
      ['shareImage', ['shareMedia']],
    ])
  })

  it('requires the same translations as publishing does', () => {
    expect([...translatedPaths].sort()).toEqual(
      [
        ...requiredTranslations,
        ...Object.entries(requiredRowTranslations).flatMap(([array, fields]) =>
          fields.map((field) => `${array}.*.${field}`),
        ),
      ].sort(),
    )
  })
})
