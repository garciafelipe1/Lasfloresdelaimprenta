'use client';

import { getSafeImageUrl } from '@/lib/get-safe-image-url';
import { isExclusive } from '@/lib/isExclusive';
import { formatMoneyByLocale } from '@/lib/money-formatter';
import { CATEGORIES } from '@server/constants';
import { ProductDTO } from '@server/types';
import { useLocale, useTranslations } from 'next-intl';

const isSanValentin = (categories: ProductDTO['categories']) =>
  (categories ?? []).some((c) => c.name === CATEGORIES.sanValentin);

/** Solo para la tarjeta del catálogo en San Valentín. No cambia los precios reales del producto ni la página de detalle. */
const SAN_VALENTIN_CATALOG_PRICE: Record<string, number> = {
  'dulce-complicidad': 90_000,
  'amor-en-equilibrio': 164_000,
  'chispa-vital': 190_000,
  'el-clasico-enamorado': 310_000,
  'declaracion-absoluta': 230_000,
  'pasion-sin-filtros': 190_000,
  'ternura-infinita': 90_000,
  'box-love-story': 170_000,
  'romance-perfumado': 164_000,
  'valentines-gold-edition': 154_000,
};

import Image from 'next/image';
import Link from 'next/link';

interface Props {
  product: ProductDTO;
}

const SCHEMA_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'https://api.nomeimporta.xyz';

/** Base URL solo desde env para evitar hydration mismatch (server vs client con window.location.origin). */
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || undefined;

export const ProductCard = ({ product }: Props) => {
  const locale = useLocale();
  const t = useTranslations('categories-products.products');
  const rawImage =
    product.images?.[0]?.url ?? product.thumbnail ?? '';
  const imageUrl = getSafeImageUrl(rawImage, IMAGE_BASE_URL);

  const productUrl = `/${locale}/ar/products/${product.handle}`;

  const lowestPrice = product.variants.reduce(
    (min, variant) =>
      Math.min(min, variant.calculated_price?.calculated_amount ?? Infinity),
    Infinity,
  );

  /** En catálogo San Valentín mostramos estos precios fijos; al entrar al producto se ven los precios reales por variante. */
  const catalogDisplayPrice = isSanValentin(product.categories)
    ? (SAN_VALENTIN_CATALOG_PRICE[product.handle] ?? lowestPrice)
    : lowestPrice;

  const currency = locale === 'en' ? 'USD' : 'ARS';

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: imageUrl || undefined,
    url: `${SCHEMA_BASE_URL}${productUrl}`,
    brand: {
      '@type': 'Brand',
      name: 'Collection',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price: lowestPrice,
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
        <p className='text-sm text-neutral-500'>
          {isExclusive(product.categories ?? [])
            ? t('consult')
            : formatMoneyByLocale(
              isSanValentin(product.categories) ? catalogDisplayPrice : lowestPrice,
              locale,
            )}
        </p>
      </div>
    </Link>
  );
};
