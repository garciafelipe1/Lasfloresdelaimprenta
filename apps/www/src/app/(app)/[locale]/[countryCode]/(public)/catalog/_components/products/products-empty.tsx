'use client';

import { Flower2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ProductsEmpty() {
  const t = useTranslations('categories-products.catalog.empty');

  return (
    <section className='flex h-full w-full items-center justify-center'>
      <div className='flex flex-col items-center gap-4 text-center'>
        <Flower2 className='h-12 w-12' />
        <h2 className='text-2xl font-semibold'>{t('title')}</h2>
        <p className='text-muted-foreground'>
          {t('description')}
        </p>
      </div>
    </section>
  );
}
