'use client';

import { getSafeImageUrl } from '@/lib/get-safe-image-url';
import { isExclusive } from '@/lib/isExclusive';
import { formatMoneyByLocale } from '@/lib/money-formatter';
import { ProductDTO } from '@server/types';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  product: ProductDTO;
}

export const ProductCard = ({ product }: Props) => {
  const locale = useLocale();
  const t = useTranslations('categories-products.products');
  const imageUrl = getSafeImageUrl(
    product.images?.[0]?.url ?? product.thumbnail ?? '',
  );

  const productUrl = `/${locale}/ar/products/${product.handle}`;

  const lowestPrice = product.variants.reduce(
    (min, variant) =>
      Math.min(min, variant.calculated_price?.calculated_amount ?? Infinity),
    Infinity,
  );

  const currency = locale === 'en' ? 'USD' : 'ARS';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.nomeimporta.xyz';

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: imageUrl || undefined,
    url: `${baseUrl}${productUrl}`,
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
      url: `${baseUrl}${productUrl}`,
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
            alt={product.title}
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
            : `${t('from')} ${formatMoneyByLocale(lowestPrice, locale)}`}
        </p>
      </div>
    </Link>
  );
};
