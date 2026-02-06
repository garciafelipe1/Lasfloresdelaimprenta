'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';
import { useTranslations } from 'next-intl';
import { Filters } from './filters';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileFilters({ open, onOpenChange }: Props) {
  const t = useTranslations('categories-products.filters');

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent className='flex flex-col space-y-4'>
        <SheetHeader className='sr-only'>
          <SheetTitle>{t('mobileTitle')}</SheetTitle>
          <SheetDescription className='m-0'>
            {t('mobileDescription')}
          </SheetDescription>
        </SheetHeader>
        <div className='pt-20'>
          <Filters onAutoAppliedCategory={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
