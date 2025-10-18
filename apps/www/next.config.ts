// apps/www/next.config.ts
import createNextIntlPlugin from 'next-intl/plugin'
import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(
  withPayload({
    images: {
      remotePatterns: [
        { protocol: 'https', hostname: '**' },
        { protocol: 'http', hostname: '**' },
      ],
    },
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },

    // 👉 standalone + monorepo
    output: 'standalone',
    // raíz del repo desde apps/www (subí 2 niveles)
    outputFileTracingRoot: path.resolve(__dirname, '../../'),

    experimental: {
      outputFileTracingIncludes: {
        '/(api|admin)?': [
          '../../packages/**',
          '../../payload/**',
          '../../*/.json',
          '../../*/.yaml',
          '../../*/.yml',
        ],
      },
    },
  }),
)