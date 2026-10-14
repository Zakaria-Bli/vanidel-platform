import { describe, expect, it } from 'vitest'

import { returnPath } from './returnPath'

describe('returnPath', () => {
  it('keeps the path of a page on this site', () => {
    expect(returnPath('https://vanidel.example/ar/concours/ete?x=1')).toBe('/ar/concours/ete')
  })

  it('refuses paths a browser would read as another site', () => {
    expect(returnPath('https://vanidel.example//outside.example/path')).toBe('/')
    expect(returnPath('https://vanidel.example/\\outside.example/path')).toBe('/')
    expect(returnPath('https://vanidel.example/%5Coutside.example')).toBe('/%5Coutside.example')
  })

  it('falls back to the home page without a usable referrer', () => {
    expect(returnPath(null)).toBe('/')
    expect(returnPath('not a url')).toBe('/')
  })
})
