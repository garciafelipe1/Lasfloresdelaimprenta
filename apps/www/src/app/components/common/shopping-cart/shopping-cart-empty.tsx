import { PackageOpen } from 'lucide-react';
import { useTranslations } from 'next-intl'; 


export function ShoppingCartEmpty() {
  const t = useTranslations('shoppingCart');
  return (
    <section className='flex h-full flex-col items-center justify-center gap-2 text-center'>
      <PackageOpen className='h-12 w-12 text-primary' />
      <h3 className='text-lg font-semibold text-primary'>{t('empty')}</h3>
      <p className='text-primary'>
        {t('emptyDescription')}
      </p>
    </section>
  );
}
