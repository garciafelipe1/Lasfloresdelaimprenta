'use client';

import { ChevronLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { formatMoneyByLocale } from '@/lib/money-formatter';
import { Button } from '../../ui/button';

interface Props {
  totalPrice: number;
  onClose?: () => void;
}

export function ShoppingCartFooter({ totalPrice, onClose }: Props) {
  const locale = useLocale();
  const t = useTranslations('footer');
  const isEnglish = locale === 'en';
  const router = useRouter();

  const navigateAndClose = (href: string) => {
    onClose?.();
    router.push(href);
  };

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
      <Button
        variant='outline'
        className='w-full'
        onClick={() => navigateAndClose(`/${locale}/ar/checkout/cart`)}
      >
        {t('finishPurchase')}
      </Button>

      <Button
        className='w-full'
        onClick={() => navigateAndClose(`/${locale}/ar/catalog`)}
      >
        <ChevronLeft className='text-primary' />
        <span>{t('continueShopping')}</span>
      </Button>
    </div>
  );
}
