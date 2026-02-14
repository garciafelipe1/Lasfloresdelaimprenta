import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { formatMoneyByLocale } from '@/lib/money-formatter';
import { StoreCart } from '@medusajs/types';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { CheckoutProductsTable } from './checkout-products-table';

interface Props {
  cart: StoreCart;
}

export async function CheckoutCart({ cart }: Props) {
  const locale = await getLocale();
  const t = await getTranslations('checkout');
  return (
    <div className='grid min-w-0 grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[1fr_minmax(280px,320px)]'>
      <CheckoutProductsTable items={cart.items ?? []} />
      <Card className='bg-secondary h-fit w-full'>
        <CardHeader className='px-4 py-3 sm:px-6 sm:py-4'>
          <CardTitle className='text-primary text-center text-base sm:text-lg'>
            {t('cart.summaryTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4 sm:px-6 sm:pb-6'>
          <div className='py-3 sm:py-4'>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-sm'>{t('amounts.subtotal')}</p>
              <span className='text-sm font-semibold'>
                {formatMoneyByLocale(cart.item_subtotal, locale)}
              </span>
            </div>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-sm'>{t('amounts.shipping')}</p>
              <span className='text-sm text-gray-500'>{t('amounts.toBeCalculated')}</span>
            </div>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-sm font-semibold'>{t('amounts.total')}</p>
              <span className='text-lg font-bold'>
                {formatMoneyByLocale(cart.total, locale)}
              </span>
            </div>
          </div>

          <Link href={`/${locale}/ar/checkout/address`} className='block'>
            <Button className='text-secondary h-11 w-full min-h-[44px] sm:h-10'>
              {t('cart.proceed')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
