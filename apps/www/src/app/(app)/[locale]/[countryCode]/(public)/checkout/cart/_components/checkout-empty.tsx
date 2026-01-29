import { Button } from '@/components/ui/button';
import { ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

export async function CheckoutEmpty() {
  const locale = await getLocale();
  const t = await getTranslations('checkout');
  return (
    <div className='container mx-auto flex flex-col items-center justify-center py-20 text-center'>
      <ShoppingCartIcon className='text-muted-foreground mb-6 h-12 w-12' />
      <h2 className='mb-2 text-2xl font-semibold'>{t('cart.empty.title')}</h2>
      <p className='text-muted-foreground mb-6'>
        {t('cart.empty.subtitle')}
      </p>
      <Button asChild>
        <Link href={`/${locale}/ar/catalog`}>{t('cart.empty.cta')}</Link>
      </Button>
    </div>
  );
}
