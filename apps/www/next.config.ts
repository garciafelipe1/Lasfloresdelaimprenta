import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  output: 'standalone',

  // Next.js 15 → ya no va dentro de "experimental"
  outputFileTracingRoot: path.join(__dirname, '../../'),

  eslint: {
    // ✅ Evita que ESLint rompa el deploy en Vercel/Docker
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
}

export default withPayload(withNextIntl(nextConfig))
