import type { DefaultServerCellComponentProps } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { WilayaCell } from './WilayaCell'

const render = (cellData: unknown, language = 'fr') =>
  renderToStaticMarkup(
    WilayaCell({ cellData, i18n: { language } } as unknown as DefaultServerCellComponentProps),
  )

describe('WilayaCell', () => {
  it('shows the code and name in the admin language', () => {
    expect(render('16')).toBe('16 - Alger')
    expect(render('16', 'en')).toBe('16 - Alger')
    expect(render('16', 'ar')).toBe('16 - الجزائر')
  })

  it('shows unknown values as stored and empty ones as nothing', () => {
    expect(render('99')).toBe('99')
    expect(render(null)).toBe('')
  })
})
