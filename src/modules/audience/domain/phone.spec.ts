import { describe, expect, it } from 'vitest'

import { normalizePhone } from './phone'

describe('normalizePhone', () => {
  it.each([
    '0555123456',
    '555123456',
    '00213555123456',
    '+213555123456',
    '+213 0555 12 34 56',
    '0555.12.34.56',
    '0555-12-34-56',
    '(0555) 123 456',
    '٠٥٥٥١٢٣٤٥٦',
  ])('normalizes %s', (input) => {
    expect(normalizePhone(input)).toBe('+213555123456')
  })

  it.each(['0612345678', '0712345678'])('accepts the %s operator prefix', (input) => {
    expect(normalizePhone(input)).toBe(`+213${input.slice(1)}`)
  })

  it.each([
    ['a landline', '021123456'],
    ['a landline with country code', '+21321123456'],
    ['too few digits', '055512345'],
    ['too many digits', '05551234567'],
    ['a foreign number', '+33612345678'],
    ['letters', '0555abc456'],
    ['an empty string', ''],
  ])('rejects %s', (_, input) => {
    expect(normalizePhone(input)).toBeNull()
  })
})
