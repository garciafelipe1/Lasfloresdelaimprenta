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
    <div className='grid grid-cols-1 gap-8 sm:grid-cols-[1fr_300px]'>
      <CheckoutProductsTable items={cart.items ?? []} />
      <Card className='bg-secondary h-fit'>
        <CardHeader>
          <CardTitle className='text-primary text-center'>
            {t('cart.summaryTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='py-4'>
            <div className='flex items-center justify-between'>
              <p className='text-sm'>{t('amounts.subtotal')}</p>
              <span className='text-sm font-semibold'>
                {formatMoneyByLocale(cart.item_subtotal, locale)}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <p className='text-sm'>{t('amounts.shipping')}</p>
              <span className='text-sm text-gray-500'>{t('amounts.toBeCalculated')}</span>
            </div>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-semibold'>{t('amounts.total')}</p>
              <span className='text-lg font-bold'>
                {formatMoneyByLocale(cart.total, locale)}
              </span>
            </div>
          </div>

          <Link href={`/${locale}/ar/checkout/address`}>
            <Button className='text-secondary w-full'>
              {t('cart.proceed')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
