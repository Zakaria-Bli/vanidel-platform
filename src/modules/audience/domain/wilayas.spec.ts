import { describe, expect, it } from 'vitest'

import { isWilayaCode, wilayas } from './wilayas'

describe('wilayas', () => {
  it('lists the 69 wilayas in code order', () => {
    expect(wilayas.map(({ code }) => Number(code))).toEqual(
      Array.from({ length: 69 }, (_, index) => index + 1),
    )
    expect(wilayas.every(({ code }) => /^\d{2}$/.test(code))).toBe(true)
  })

  it('names every wilaya in French and Arabic', () => {
    expect(wilayas.every(({ fr, ar }) => fr.trim() !== '' && /\p{Script=Arabic}/u.test(ar))).toBe(
      true,
    )
  })

  it('recognizes codes', () => {
    expect(isWilayaCode('16')).toBe(true)
    expect(isWilayaCode('69')).toBe(true)
    expect(isWilayaCode('70')).toBe(false)
    expect(isWilayaCode(16)).toBe(false)
  })
})
