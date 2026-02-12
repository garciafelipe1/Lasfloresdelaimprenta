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
      unoptimized: true,
      remotePatterns: [
        { protocol: 'https', hostname: '*' },
        { protocol: 'http', hostname: '*' },
        // R2 público (landing categorías San Valentín y Box)
        {
          protocol: 'https',
          hostname: 'pub-43da7721872a46ffac4397d05373bc0d.r2.dev',
          pathname: '/**',
        },
      ],
    },

    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },

    output: 'standalone',
    outputFileTracingRoot: path.resolve(__dirname, '../../'),
    outputFileTracingIncludes: {
      '/*': [
        '../../packages/**',
        '../../payload/**',
        '../../*/.json',
        '../../*/.yaml',
        '../../*/.yml',
      ],
      '/api/*': [
        '../../packages/**',
        '../../payload/**',
        '../../*/.json',
        '../../*/.yaml',
        '../../*/.yml',
      ],
      '/admin/*': [
        '../../packages/**',
        '../../payload/**',
        '../../*/.json',
        '../../*/.yaml',
        '../../*/.yml',
      ],
    },
  }),
)
