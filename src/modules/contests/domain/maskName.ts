const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

/**
 * Public winner name (SPECIFICATION §11): the first name followed by the last name's initial,
 * e.g. "Amine Benali" → "Amine B.". A single name is shown as is. Initials are taken by grapheme so
 * Arabic letters with diacritics stay whole.
 */
export function maskName(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return words[0] ?? ''

  const [initial] = graphemes.segment(words[words.length - 1])
  return `${words[0]} ${initial.segment.toLocaleUpperCase()}.`
}
