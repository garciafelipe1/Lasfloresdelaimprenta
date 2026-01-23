'use client';

import { Button } from '@/app/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/app/components/ui/sheet';
import { useTranslations } from 'next-intl';
import { Filters } from './filters';

export function MobileFilters() {
  const t = useTranslations('categories-products.filters');

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>{t('mobileButton')}</Button>
      </SheetTrigger>
      <SheetContent className='flex flex-col space-y-4'>
        <SheetHeader className='sr-only'>
          <SheetTitle>{t('mobileTitle')}</SheetTitle>
          <SheetDescription className='m-0'>
            {t('mobileDescription')}
          </SheetDescription>
        </SheetHeader>
        <div className='pt-20'>
          <Filters />
        </div>
      </SheetContent>
    </Sheet>
  );
}
