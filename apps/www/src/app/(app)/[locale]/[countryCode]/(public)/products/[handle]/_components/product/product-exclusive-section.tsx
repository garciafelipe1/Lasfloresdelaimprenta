'use client';

import { Button } from '@/app/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

export function ExclusiveSection({ handle }: { handle: string }) {
  const locale = useLocale();
  const t = useTranslations('categories-products.products.exclusive');

  return (
    <section className='bg-secondary flex flex-col gap-4 rounded-lg p-6'>
      <h2 className='m-0 text-xl font-bold'>{t('title')}</h2>
      <p className='m-0'>
        {t('description')}
      </p>
      <Link
        href={`/${locale}/ar/products/${handle}`}
        className='group w-full'
      >
        <Button className='w-full'>
          {t('consultPrices')}
          <ArrowUpRight className='transition group-hover:translate-x-[2px] group-hover:translate-y-[-2px]' />
        </Button>
      </Link>
    </section>
  );
}
