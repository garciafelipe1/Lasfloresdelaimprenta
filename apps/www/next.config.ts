// apps/www/next.config.ts
import createNextIntlPlugin from 'next-intl/plugin'
import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const withNextIntl = createNextIntlPlugin()

/** Redirecciones 301: URLs antiguas de Diseños Exclusivos → handle actual (slug del nuevo nombre). */
const EXCLUSIVE_DESIGNS_PRODUCT_REDIRECTS: [string, string][] = [
  ['reconocimiento-absoluto', 'the-masterpiece-red'],
  ['esencia-inolvidable', 'the-lily-and-rose-edit'],
  ['mujer-lider', 'the-corporate-red'],
  ['determinacion-pura', 'crimson-monochrome'],
  ['fuerza-y-equilibrio', 'the-scarlet-structure'],
  ['elegancia-y-gracia', 'the-blush-minimal'],
  ['box-vanguardia-femenina', 'the-signature-hatbox'],
  ['admiracion-sutil', 'the-neutral-palette'],
  ['energia-creadora', 'vibrant-coral-edit'],
  ['edicion-oro-8m', 'the-premium-rouge'],
  ['box-esencia-y-admiracion', 'the-curated-experience-box'],
  ['box-esencia-y-admiración', 'the-curated-experience-box'],
  ['flower-bag', 'the-petite-gesture'],
  ['bouquet-spring-en-florero', 'the-dynamic-centerpiece'],
  ['dulce-complicidad', 'the-neutral-palette'],
  ['amor-en-equilibrio', 'the-scarlet-structure'],
  ['chispa-vital', 'vibrant-coral-edit'],
  ['el-clasico-enamorado', 'the-masterpiece-red'],
  ['declaracion-absoluta', 'the-corporate-red'],
  ['pasion-sin-filtros', 'crimson-monochrome'],
  ['ternura-infinita', 'the-blush-minimal'],
  ['box-love-story', 'the-signature-hatbox'],
  ['romance-perfumado', 'the-lily-and-rose-edit'],
  ['valentines-gold-edition', 'the-premium-rouge'],
]

export default withNextIntl(
  withPayload({
    async redirects() {
      return EXCLUSIVE_DESIGNS_PRODUCT_REDIRECTS.map(([oldHandle, newHandle]) => ({
        source: `/:locale/:countryCode/products/${oldHandle}`,
        destination: `/:locale/:countryCode/products/${newHandle}`,
        permanent: true,
      }))
    },
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
