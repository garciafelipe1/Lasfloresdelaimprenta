'use client';

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
  let initialImage;
  let hoverImage;

  if (product.images?.length) {
    initialImage = product.images[0].url;
    hoverImage =
      product.images.length > 1 ? product.images[1].url : initialImage;
  }

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
    image: initialImage,
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
      className='group flex w-full cursor-pointer flex-col items-center justify-center gap-4'
    >
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <div className='relative aspect-[4/5] w-full overflow-hidden rounded-md'>
        {initialImage && (
          <Image
            draggable={false}
            className='absolute inset-0 h-full w-full object-cover opacity-100 transition-opacity duration-300 hover:opacity-0'
            alt={product.title + ' initial'}
            src={initialImage}
            fill
          />
        )}
        {hoverImage && (
          <Image
            draggable={false}
            className='absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 hover:opacity-100'
            alt={product.title + ' hover'}
            src={hoverImage}
            fill
          />
        )}
      </div>
      <div className='flex flex-col items-center justify-center *:text-center **:m-0'>
        <p className='text-sm font-semibold'>{product.title}</p>
        <p className='text-primary/50 text-sm font-semibold'>
          {isExclusive(product.categories ?? [])
            ? t('consult')
            : `${t('from')} ${formatMoneyByLocale(lowestPrice, locale)}`}
        </p>
      </div>
    </Link>
  );
};
