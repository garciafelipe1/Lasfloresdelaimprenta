'use client';

import { useCartQueryParam } from '@/app/hooks/use-cart-query-param';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { StoreCart } from '@medusajs/types';
import { ShoppingBagIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { ShoppingCartEmpty } from './shopping-cart-empty';
import { ShoppingCartFooter } from './shopping-cart-footer';
import { ShoppingCartItem } from './shopping-cart-item';

interface Props {
  cart: StoreCart | null;
}

export const ShoppingCart = ({ cart }: Props) => {
  const { openCart, clearCartParam } = useCartQueryParam();
  const [sheetOpen, setSheetOpen] = useState(false);
  const firstLoad = useRef(true);

  const t = useTranslations('shoppingCart');

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }

    if (openCart) {
      setSheetOpen(true);
      clearCartParam();
    }
  }, [openCart, clearCartParam]);

  const items = cart?.items ?? [];
  const hasItems = items.length > 0;

  const totalProducts =
    (cart &&
      cart.items?.reduce((acc, item) => {
        return acc + item.quantity;
      }, 0)) ||
    0;

  return (
    <Sheet
      open={sheetOpen}
      onOpenChange={setSheetOpen}
    >
      <SheetTrigger asChild>
        <Button
          className='relative'
          variant='outline'
          size='icon'
        >
          <ShoppingBagIcon className='h-5 w-5 text-primary' />
          <span className='sr-only'>{t('ariaLabel')}</span>
          {totalProducts > 0 && (
            <span className='absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] leading-none text-primary-foreground ring-2 ring-background'>
              {totalProducts}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className='flex flex-col space-y-4'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2 text-primary'>
            {t('sheetTitle')}
          </SheetTitle>
          <SheetDescription className='m-0 text-primary'>
            {t('sheetDescription')}
          </SheetDescription>
        </SheetHeader>

        {!hasItems ? (
          <ShoppingCartEmpty />
        ) : (
          <>
            <ul className='flex flex-grow flex-col gap-2 overflow-y-auto px-2'>
              {items?.map((item) => (
                <ShoppingCartItem
                  key={item.id}
                  item={item}
                />
              ))}
            </ul>
            <ShoppingCartFooter totalPrice={cart?.item_total ?? 0} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
