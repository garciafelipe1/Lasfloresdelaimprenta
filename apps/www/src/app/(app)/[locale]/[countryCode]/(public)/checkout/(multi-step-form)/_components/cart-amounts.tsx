import { formatMoneyByLocale } from '@/lib/money-formatter';
import { getLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

interface Props {
  itemsTotal: number;
  shippingTotal: number;
  total: number;
}

export async function CartAmounts({ itemsTotal, shippingTotal, total }: Props) {
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
        <p className='m-0'>{formatMoneyByLocale(shippingTotal, locale)}</p>
      </div>
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
