import { describe, expect, it } from 'vitest'

import { maskName } from './maskName'

describe('maskName', () => {
  it.each([
    ['Amine Benali', 'Amine B.'],
    ['  amine   benali ', 'amine B.'],
    ['Mohamed Amine Benali', 'Mohamed B.'],
    ['Amine', 'Amine'],
    ['', ''],
    ['أمين بلعيد', 'أمين ب.'],
    ['سَمير قاسِم', 'سَمير ق.'],
  ])('masks %j as %j', (input, expected) => {
    expect(maskName(input)).toBe(expected)
  })
})
