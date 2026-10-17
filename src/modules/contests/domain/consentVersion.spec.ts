import { describe, expect, it } from 'vitest'

import { consentTextVersion } from './consentVersion'

const label = { fr: 'J’accepte le règlement.', ar: 'أوافق على النظام.' }

describe('consentTextVersion', () => {
  it('is a short, stable code for the same wording', () => {
    expect(consentTextVersion(label)).toMatch(/^[0-9a-f]{8}$/)
    expect(consentTextVersion({ ...label })).toBe(consentTextVersion(label))
  })

  it.each([
    ['the French text', { ...label, fr: 'J’accepte le règlement du concours.' }],
    ['the Arabic text', { ...label, ar: 'أوافق على نظام المسابقة.' }],
    ['a missing translation', { fr: label.fr }],
  ])('changes with %s', (_, changed) => {
    expect(consentTextVersion(changed)).not.toBe(consentTextVersion(label))
  })

  it('ignores surrounding spaces', () => {
    expect(consentTextVersion({ ...label, fr: ` ${label.fr}\n` })).toBe(consentTextVersion(label))
  })

  it('does not mix up texts across languages', () => {
    expect(consentTextVersion({ fr: 'a', ar: 'b' })).not.toBe(
      consentTextVersion({ fr: 'b', ar: 'a' }),
    )
  })
})
