import { formatMoneyByLocale } from '@/lib/money-formatter';
import { getLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

interface Props {
  itemsTotal: number;
  shippingTotal: number;
  total: number;
  discountTotal?: number;
  shippingDisplay?: string;
}

export async function CartAmounts({
  itemsTotal,
  shippingTotal,
  total,
  discountTotal,
  shippingDisplay,
}: Props) {
  const locale = await getLocale();
  const tFooter = await getTranslations('footer');
  const tCheckout = await getTranslations('checkout');
  const isEnglish = locale === 'en';
  return (
    <section className='flex flex-col divide-y *:py-2'>
      <div className='flex items-center justify-between font-light'>
        <p className='m-0'>{tCheckout('amounts.subtotal')}</p>
        <p className='m-0'>{formatMoneyByLocale(itemsTotal, locale)}</p>
      </div>
      <div className='flex items-center justify-between font-light'>
        <p className='m-0'>{tCheckout('amounts.shipping')}</p>
        <p className='m-0'>
          {shippingDisplay ?? formatMoneyByLocale(shippingTotal, locale)}
        </p>
      </div>
      {typeof discountTotal === 'number' && discountTotal !== 0 ? (
        <div className='flex items-center justify-between font-light text-green-600 dark:text-green-400'>
          <p className='m-0'>{tCheckout('amounts.discount')}</p>
          <p className='m-0'>-{formatMoneyByLocale(Math.abs(discountTotal), locale)}</p>
        </div>
      ) : null}
      <div className='flex items-center justify-between font-semibold'>
        <p className='m-0'>{tCheckout('amounts.total')}</p>
        <p className='m-0'>{formatMoneyByLocale(total, locale)}</p>
      </div>
      {isEnglish ? (
        <p className='pt-2 text-xs text-muted-foreground leading-snug'>
          {tFooter('currencyNote')}
        </p>
      ) : null}
    </section>
  );
}
