import { draftMode } from 'next/headers'

import { returnPath } from '@/lib/returnPath'

/** POST /api/preview/exit: leaves preview and returns to the page it was left from. */
export async function POST(request: Request) {
  ;(await draftMode()).disable()
  // A path on this site only; relative, since behind the proxy the request URL carries the
  // internal host.
  const back = returnPath(request.headers.get('referer'))
  return new Response(null, { status: 303, headers: { Location: back } })
}
