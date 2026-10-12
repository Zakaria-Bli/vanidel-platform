import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Keep CSP and HSTS at the deployment layer until Payload admin, previews, and production TLS are configured.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // SAMEORIGIN allows same-origin Payload live previews while blocking external framing.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      // Receipt photos are resized in the browser to a few hundred KB, but an undecodable one
      // (HEIC outside Safari) is sent as is; 10 MB, the service's limit, plus multipart overhead.
      bodySizeLimit: '11mb',
    },
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withNextIntl(withPayload(nextConfig, { devBundleServerPackages: false }))
