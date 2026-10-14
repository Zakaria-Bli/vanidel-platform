const copySuffix = /-copie(?:-\d+)?$/

/**
 * The slug of a contest duplicated from `slug`: `ete-copie`, then `ete-copie-2`… skipping the
 * ones `taken`. Duplicating a copy starts again from the original name rather than stacking.
 */
export function duplicateSlug(slug: string, taken: ReadonlySet<string>): string {
  const base = `${slug.replace(copySuffix, '')}-copie`
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`
    if (!taken.has(candidate)) return candidate
  }
}

/** The prefix every slug `duplicateSlug` may return starts with, to look up the taken ones. */
export const duplicateSlugPrefix = (slug: string) => `${slug.replace(copySuffix, '')}-copie`
