// apps/www/next.config.ts
import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const withNextIntl = createNextIntlPlugin()

const baseConfig = {
  // cualquier config base propia
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },

  eslint: { ignoreDuringBuilds: true },
  // 👇 opcional: evita que un error de TS rompa el build de Docker
  typescript: { ignoreBuildErrors: true },
} as const

// 1) Componer plugins
const composed = withNextIntl(withPayload(baseConfig))

// 2) Reinyectar opciones críticas AL FINAL
const finalConfig = {
  ...composed,
  output: 'standalone',
  // raíz ABSOLUTA del repo (desde apps/www, subir 2 niveles)
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
} as const

export default finalConfig