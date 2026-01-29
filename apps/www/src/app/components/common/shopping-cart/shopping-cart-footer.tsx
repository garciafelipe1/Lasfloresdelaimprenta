'use client';

import { ChevronLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { formatMoneyByLocale } from '@/lib/money-formatter';
import { Button } from '../../ui/button';

interface Props {
  totalPrice: number;
}

export function ShoppingCartFooter({ totalPrice }: Props) {
  const locale = useLocale();
  const t = useTranslations('footer');
  const isEnglish = locale === 'en';

  return (
    <div className='sticky bottom-0 flex w-full flex-col gap-4 border-t p-8'>
      <header className='flex items-center justify-between px-4'>
        <div className='text-lg font-semibold text-primary'>{t('total')}</div>
        <div className='text-lg font-semibold text-primary'>
          {formatMoneyByLocale(totalPrice, locale)}
        </div>
      </header>
      {isEnglish ? (
        <p className='px-4 text-xs text-muted-foreground leading-snug'>
          {t('currencyNote')}
        </p>
      ) : null}
      <Link href={`/${locale}/ar/checkout/cart`}>
        <Button
          variant='outline'
          className='w-full'
        >
          {t('finishPurchase')}
        </Button>
      </Link>

      <Link
        href={`/${locale}/ar/catalog`}
        className=''
      >
        <Button className='w-full'>
          <ChevronLeft className='text-primary' />
          <span>{t('continueShopping')}</span>
        </Button>
      </Link>
    </div>
  );
}
