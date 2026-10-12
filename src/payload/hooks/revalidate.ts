import { revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
  RequestContext,
} from 'payload'

import { cacheTags } from '@/modules/contests/queries/cacheTags'

/** Set `context: { skipRevalidate: true }` on writes made outside Next.js (seed, scripts). */
export interface RevalidateContext extends RequestContext {
  skipRevalidate?: boolean
}

function revalidate(tags: string[], req: PayloadRequest, context: RevalidateContext) {
  if (context.skipRevalidate) return
  for (const tag of new Set(tags)) {
    try {
      // Expire immediately rather than serve stale-while-revalidate: the next visitor must see
      // the edit, notably new consent texts, which a stale page would make them refuse.
      revalidateTag(tag, { expire: 0 })
    } catch (error) {
      // Outside a Next.js request (tests, `payload run`) there is no cache to invalidate.
      req.payload.logger.debug({ err: error, msg: `Skipped revalidating ${tag}` })
    }
  }
}

function contestTags(...docs: ({ slug?: unknown } | undefined)[]): string[] {
  const slugs = docs.flatMap((doc) => (typeof doc?.slug === 'string' ? [doc.slug] : []))
  return [cacheTags.contests, ...slugs.map(cacheTags.contest)]
}

export const revalidateContestAfterChange: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  // A changed slug must also drop the page cached under the old one.
  revalidate(contestTags(doc, previousDoc), req, context)
  return doc
}

export const revalidateContestAfterDelete: CollectionAfterDeleteHook = ({ doc, req, context }) => {
  revalidate(contestTags(doc), req, context)
  return doc
}

/** Media is embedded in contest pages (hero, prizes, share image, regulation). */
export const revalidateMediaAfterChange: CollectionAfterChangeHook = ({ doc, req, context }) => {
  revalidate([cacheTags.contests], req, context)
  return doc
}

export const revalidateMediaAfterDelete: CollectionAfterDeleteHook = ({ doc, req, context }) => {
  revalidate([cacheTags.contests], req, context)
  return doc
}

export const revalidateSettingsAfterChange: GlobalAfterChangeHook = ({ doc, req, context }) => {
  revalidate([cacheTags.settings], req, context)
  return doc
}
