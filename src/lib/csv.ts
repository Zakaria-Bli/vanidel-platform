export type CsvValue = string | number | boolean | null | undefined

// A plain number or phone (+213 555…, -12.5) is safe; anything else starting with these could be
// read as a formula by Excel or LibreOffice (CSV injection).
const formulaStart = /^[=+\-@\t\r]/
const plainNumber = /^[+-]?[\d\s().]+$/

function cell(value: CsvValue): string {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (formulaStart.test(text) && !plainNumber.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * CSV for spreadsheets: a UTF-8 byte-order mark so Excel reads Arabic correctly, CRLF line ends
 * (RFC 4180), quoting where needed, and formula-looking cells neutralized.
 */
export function toCsv(header: string[], rows: CsvValue[][]): string {
  return '﻿' + [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n'
}

/** A file download response for `toCsv` output. */
export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
