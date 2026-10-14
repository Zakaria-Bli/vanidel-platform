import { draftMode } from 'next/headers'

/** POST /api/preview/exit: leaves preview and returns to the page it was left from. */
export async function POST(request: Request) {
  ;(await draftMode()).disable()
  const referer = request.headers.get('referer')
  // Only the path is kept, so the redirect stays on this site; relative, since behind the proxy
  // the request URL carries the internal host.
  const back = referer ? new URL(referer).pathname : '/'
  return new Response(null, { status: 303, headers: { Location: back } })
}
