import { PackageOpen } from 'lucide-react';
import { useTranslations } from 'next-intl'; 


export function ShoppingCartEmpty() {
  const t = useTranslations('shoppingCart');
  return (
    <section className='text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-center'>
      <PackageOpen className='h-12 w-12' />
      <h3 className='text-lg font-semibold'>{t('empty')}</h3>
      <p>
        {t('emptyDescription')}
      </p>
    </section>
  );
}
