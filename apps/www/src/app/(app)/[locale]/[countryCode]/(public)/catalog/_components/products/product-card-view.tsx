import { getSafeImageUrl } from '@/lib/get-safe-image-url';
import { isExclusive } from '@/lib/isExclusive';
import { formatMoneyByLocale } from '@/lib/money-formatter';
import { CATEGORIES } from '@server/constants';
import { ProductDTO } from '@server/types';
import Image from 'next/image';
import Link from 'next/link';

const isDiaDeLaMujer = (categories: ProductDTO['categories']) =>
  (categories ?? []).some((c) => c.name === CATEGORIES.sanValentin);

const isBoxCategory = (categories: ProductDTO['categories']) =>
  (categories ?? []).some((c) => c.name === CATEGORIES.box);

/** Precio en catálogo para todos los productos de la categoría Box (ARS). */
const BOX_CATALOG_PRICE_ARS = 95_000;

const PRODUCTOS_LIMITADOS = new Set(
  [
    'THE NEUTRAL PALETTE.',
    'THE SCARLET STRUCTURE.',
    'VIBRANT CORAL EDIT.',
    'THE MASTERPIECE RED.',
    'THE CORPORATE RED.',
    'CRIMSON MONOCHROME.',
    'THE BLUSH MINIMAL.',
    'THE SIGNATURE HATBOX.',
    'THE LILY & ROSE EDIT.',
    'THE PREMIUM ROUGE.',
    'THE PETITE GESTURE.',
    'THE DYNAMIC CENTERPIECE.',
    'THE CURATED EXPERIENCE BOX.',
  ].map((t) => t.trim().toLowerCase())
);
const isProductoLimitado = (title: string | undefined) =>
  Boolean(title && PRODUCTOS_LIMITADOS.has(title.trim().toLowerCase()));

const DIA_DE_LA_MUJER_CATALOG_PRICE: Record<string, number> = {
  'dulce-complicidad': 50_000,
  'amor-en-equilibrio': 50_000,
  'chispa-vital': 50_000,
  'el-clasico-enamorado': 50_000,
  'declaracion-absoluta': 50_000,
  'pasion-sin-filtros': 50_000,
  'ternura-infinita': 50_000,
  'box-love-story': 50_000,
  'romance-perfumado': 50_000,
  'valentines-gold-edition': 50_000,
  'admiracion-sutil': 90_000,
  'fuerza-y-equilibrio': 164_000,
  'energia-creadora': 190_000,
  'reconocimiento-absoluto': 310_000,
  'mujer-lider': 230_000,
  'determinacion-pura': 190_000,
  'elegancia-y-gracia': 90_000,
  'box-vanguardia-femenina': 170_000,
  'esencia-inolvidable': 164_000,
  'edicion-oro-8m': 154_000,
  'the-neutral-palette': 90_000,
  'the-scarlet-structure': 164_000,
  'vibrant-coral-edit': 190_000,
  'the-masterpiece-red': 310_000,
  'the-corporate-red': 230_000,
  'crimson-monochrome': 190_000,
  'the-blush-minimal': 90_000,
  'the-signature-hatbox': 170_000,
  'the-lily-and-rose-edit': 164_000,
  'the-premium-rouge': 154_000,
};

const SCHEMA_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'https://api.nomeimporta.xyz';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || undefined;

export interface ProductCardViewProps {
  product: ProductDTO;
  locale: string;
  consultLabel: string;
  productLimitedLabel: string;
}

export function ProductCardView({
  product,
  locale,
  consultLabel,
  productLimitedLabel,
}: ProductCardViewProps) {
  const rawImage =
    product.images?.[0]?.url ?? product.thumbnail ?? '';
  const imageUrl = getSafeImageUrl(rawImage, IMAGE_BASE_URL);
  const productUrl = `/${locale}/ar/products/${product.handle}`;

  const lowestPrice = product.variants.reduce(
    (min, variant) =>
      Math.min(min, variant.calculated_price?.calculated_amount ?? Infinity),
    Infinity,
  );

  const catalogDisplayPrice = isBoxCategory(product.categories)
    ? BOX_CATALOG_PRICE_ARS
    : isDiaDeLaMujer(product.categories)
      ? (DIA_DE_LA_MUJER_CATALOG_PRICE[product.handle] ?? lowestPrice)
      : lowestPrice;

  const currency = locale === 'en' ? 'USD' : 'ARS';

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: imageUrl || undefined,
    url: `${SCHEMA_BASE_URL}${productUrl}`,
    brand: { '@type': 'Brand', name: 'Collection' },
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price: catalogDisplayPrice,
      itemCondition: 'https://schema.org/NewCondition',
      availability: 'https://schema.org/InStock',
      url: `${SCHEMA_BASE_URL}${productUrl}`,
    },
  };

  return (
    <Link
      href={productUrl}
      className='group flex w-full cursor-pointer flex-col gap-3'
    >
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <div className='relative aspect-[4/5] w-full overflow-hidden rounded-md bg-neutral-100'>
        {imageUrl ? (
          <Image
            draggable={false}
            className='absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]'
            alt=""
            src={imageUrl}
            fill
            sizes='(max-width: 768px) 50vw, 300px'
          />
        ) : null}
      </div>
      <div className='flex flex-col items-center justify-center gap-0.5 *:text-center **:m-0'>
        <p className='text-sm font-semibold text-foreground'>{product.title}</p>
        {isProductoLimitado(product.title) ? (
          <span className='text-xs font-medium text-primary'>
            {productLimitedLabel}
          </span>
        ) : null}
        <p className='text-sm text-neutral-500'>
          {isExclusive(product.categories ?? [])
            ? consultLabel
            : formatMoneyByLocale(catalogDisplayPrice, locale)}
        </p>
      </div>
    </Link>
  );
}
