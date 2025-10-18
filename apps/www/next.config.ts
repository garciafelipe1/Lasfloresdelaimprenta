// apps/www/next.config.ts (o .js/.mjs)
import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const withNextIntl = createNextIntlPlugin()

const nextConfig = {
  output: 'standalone',
  // 👇 importante: raíz ABSOLUTA del repo (desde apps/www subes 2 niveles)
  outputFileTracingRoot: path.resolve(__dirname, '../../'),

  eslint: { ignoreDuringBuilds: true },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
} as const

export default withPayload(withNextIntl(nextConfig))