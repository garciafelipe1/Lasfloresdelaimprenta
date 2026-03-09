'use client';

import { ProductDTO } from '@server/types';
import { useLocale, useTranslations } from 'next-intl';
import { ProductCardView } from './product-card-view';

interface Props {
  product: ProductDTO;
}

export function ProductCard({ product }: Props) {
  const locale = useLocale();
  const t = useTranslations('categories-products.products');

  return (
    <ProductCardView
      product={product}
      locale={locale}
      consultLabel={t('consult')}
      productLimitedLabel={t('productLimited')}
    />
  );
}
