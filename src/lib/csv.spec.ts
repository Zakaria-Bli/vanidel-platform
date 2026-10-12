import { describe, expect, it } from 'vitest'

import { csvResponse, toCsv } from './csv'

describe('toCsv', () => {
  it('starts with a byte-order mark and ends lines with CRLF', () => {
    expect(toCsv(['a', 'b'], [[1, 'x']])).toBe('\uFEFFa,b\r\n1,x\r\n')
  })

  it('quotes commas, quotes and line breaks', () => {
    expect(toCsv(['v'], [['a,b'], ['say "hi"'], ['two\nlines']])).toBe(
      '\uFEFFv\r\n"a,b"\r\n"say ""hi"""\r\n"two\nlines"\r\n',
    )
  })

  it('keeps Arabic text and empty values', () => {
    expect(toCsv(['name', 'email'], [['أمين بلعيد', null]])).toBe(
      '\uFEFFname,email\r\nأمين بلعيد,\r\n',
    )
  })

  it.each([
    ['=HYPERLINK("http://x")', `"'=HYPERLINK(""http://x"")"`],
    ['@SUM(A1)', "'@SUM(A1)"],
    ['+cmd|calc', "'+cmd|calc"],
    ['-2+3', "'-2+3"],
  ])('neutralizes the formula %s', (value, expected) => {
    expect(toCsv(['v'], [[value]])).toBe(`\uFEFFv\r\n${expected}\r\n`)
  })

  it('leaves phone numbers and negative numbers alone', () => {
    expect(toCsv(['v'], [['+213555123456'], ['+213 555 12 34 56'], ['-12.5']])).toBe(
      '\uFEFFv\r\n+213555123456\r\n+213 555 12 34 56\r\n-12.5\r\n',
    )
  })
})

describe('csvResponse', () => {
  it('serves the file as a UTF-8 download', async () => {
    const response = csvResponse(toCsv(['a'], []), 'export.csv')

    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8')
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="export.csv"')
    // The byte-order mark must reach the file; text() would strip it when decoding.
    const bytes = [...new Uint8Array(await response.arrayBuffer())]
    expect(bytes.slice(0, 3)).toEqual([0xef, 0xbb, 0xbf])
  })
})
