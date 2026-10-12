import { getCachedSettings } from '@/modules/contests/queries/cached'

// Public pixel IDs for the cookie banner and tracking scripts. Read from the settings cache, so
// the database is queried once per settings change, not once per visitor.
export const dynamic = 'force-dynamic'

export async function GET() {
  const { metaPixelId, ga4Id } = await getCachedSettings('fr')
  return Response.json(
    { metaPixelId: metaPixelId || null, ga4Id: ga4Id || null },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  )
}
