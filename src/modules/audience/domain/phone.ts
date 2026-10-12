// Arabic-Indic (U+0660–0669) and Persian (U+06F0–06F9) digits, which Arabic phone keyboards type.
const easternDigits = /[٠-٩۰-۹]/g

function toAsciiDigits(value: string): string {
  return value.replace(easternDigits, (digit) => String(digit.charCodeAt(0) & 0xf))
}

/**
 * Normalizes an Algerian mobile number to `+213` followed by 9 digits starting with 5, 6 or 7
 * (SPECIFICATION §7.2). Accepts `05…`, `5…`, `00213…` and `+213…` (also with a stray trunk `0`
 * after the country code), with spaces, dots, dashes or parentheses. Returns null for anything
 * else, including landlines.
 */
export function normalizePhone(input: string): string | null {
  const compact = toAsciiDigits(input).replace(/[\s.\-()]/g, '')
  const match = /^(?:(?:\+|00)213)?0?([567]\d{8})$/.exec(compact)
  return match ? `+213${match[1]}` : null
}
