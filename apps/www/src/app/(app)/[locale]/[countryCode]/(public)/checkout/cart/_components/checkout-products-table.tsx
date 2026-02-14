'use client';

import { removeFromCartAction } from '@/app/actions/cart/remove-from-cart.action';
import { upateItemQuantityAction } from '@/app/actions/cart/update-item-quantity.action';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { getSafeImageUrl } from '@/lib/get-safe-image-url';
import { formatMoneyByLocale } from '@/lib/money-formatter';
import { StoreCart } from '@medusajs/types';
import { Trash } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import Image from 'next/image';
import { toast } from 'sonner';

interface Props {
  items: StoreCart['items'];
}

export function CheckoutProductsTable({ items }: Props) {
  const locale = useLocale();
  const t = useTranslations('checkout');
  const removeItem = useAction(removeFromCartAction, {
    onError() {
      toast.error(t('cart.table.toasts.removeError'));
    },
    onSuccess() {
      console.log('PRODUCTO ELIMINADO');
    },
  });

  const updateQuantity = useAction(upateItemQuantityAction, {
    onError() {
      toast.error(t('cart.table.toasts.quantityError'));
    },
    onSuccess() {
      console.log('PRODUCTO ACTUALIZADO');
    },
  });

  const handleIncreaseItemQuantity = (itemId: string) => {
    if (!items) return;

    updateQuantity.execute({
      itemId,
      quantity: items.find((i) => i.id === itemId)!.quantity + 1,
    });
  };

  const handleDecreaseItemQuantity = (itemId: string) => {
    if (!items) return;

    const item = items.find((i) => i.id === itemId)!;

    if (item.quantity === 1) return;

    updateQuantity.execute({
      itemId,
      quantity: item.quantity - 1,
    });
  };

  return (
    <Card className='h-fit flex-1 overflow-auto p-3 sm:p-4'>
      {/* Header: solo visible en desktop */}
      <div className='hidden grid-cols-[min(100%,120px)_1fr_min(100%,120px)_min(100%,120px)_min(100%,150px)_min-content] items-center gap-4 py-2 text-sm text-gray-500 sm:grid'>
        <span className='text-primary'>{t('cart.table.product')}</span>
        <span></span>
        <div className='text-primary ml-18 text-left'>{t('cart.table.price')}</div>
        <div className='text-primary text-center'>{t('cart.table.quantity')}</div>
        <div className='text-primary mr-16 text-right'>{t('cart.table.total')}</div>
        <span></span>
      </div>
      {items?.map((item) => {
        const productTitle =
          ((item as any).product?.title as string | undefined) ||
          ((item as any).variant?.product?.title as string | undefined);
        const displayTitle = productTitle || item.title;
        const rawVariantTitle =
          item.title && item.title !== displayTitle ? item.title : null;
        const variantTitle =
          rawVariantTitle && rawVariantTitle.trim().toLowerCase() === 'default'
            ? null
            : rawVariantTitle;
        const meta = (item as any).metadata as
          | { preparado?: string; indicaciones?: string; dedicatoria?: string }
          | undefined;

        return (
          <div
            key={item.id}
            className='border-t py-4 sm:grid sm:grid-cols-[min(100%,120px)_1fr_min(100%,120px)_min(100%,120px)_min(100%,150px)_min-content] sm:items-center sm:gap-4 sm:py-4 sm:text-center'
          >
            {/* Móvil: card apilada */}
            <div className='flex flex-col gap-3 sm:contents'>
              <div className='flex gap-3 sm:contents'>
                {item.thumbnail && (
                  <div className='relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md sm:h-20 sm:w-20'>
                    <Image
                      src={getSafeImageUrl(item.thumbnail)}
                      className='object-cover'
                      alt={displayTitle}
                      fill
                      sizes='80px'
                    />
                  </div>
                )}
                <div className='min-w-0 flex-1'>
                  <h3 className='text-primary text-sm font-semibold sm:mb-8'>
                    {displayTitle}
                  </h3>
                  {variantTitle ? (
                    <p className='mt-0.5 text-xs text-muted-foreground sm:-mt-6'>
                      Variante: {variantTitle}
                    </p>
                  ) : null}
                  {meta?.preparado ? (
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Preparado: {meta.preparado}
                    </p>
                  ) : null}
                  {meta?.dedicatoria ? (
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Dedicatoria: {meta.dedicatoria}
                    </p>
                  ) : null}
                  {meta?.indicaciones ? (
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Indicaciones: {meta.indicaciones}
                    </p>
                  ) : null}
                  <p className='mt-1 text-sm font-medium sm:hidden'>
                    {formatMoneyByLocale(item.unit_price, locale)} × {item.quantity} ={' '}
                    {formatMoneyByLocale(item.unit_price * item.quantity, locale)}
                  </p>
                </div>
              </div>

              <div className='flex flex-wrap items-center justify-between gap-2 sm:contents'>
                <div className='hidden text-sm sm:block sm:text-right'>
                  {formatMoneyByLocale(item.unit_price, locale)}
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    disabled={updateQuantity.isExecuting || item.quantity === 1}
                    className='h-8 w-8 bg-secondary text-primary hover:bg-primary/40 sm:h-8 sm:w-8'
                    size='sm'
                    onClick={() => handleDecreaseItemQuantity(item.id)}
                  >
                    -
                  </Button>
                  <span className='text-primary min-w-[1.25rem] text-center text-sm'>
                    {item.quantity}
                  </span>
                  <Button
                    disabled={updateQuantity.isExecuting}
                    className='h-8 w-8 bg-secondary text-primary hover:bg-primary/40 sm:h-8 sm:w-8'
                    size='sm'
                    onClick={() => handleIncreaseItemQuantity(item.id)}
                  >
                    +
                  </Button>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='hidden text-right text-sm font-semibold sm:mr-2 sm:block'>
                    {formatMoneyByLocale(item.unit_price * item.quantity, locale)}
                  </span>
                  <Button
                    onClick={() => removeItem.execute({ variantId: item.id! })}
                    variant='outline'
                    size='icon'
                    className='h-8 w-8 shrink-0 sm:h-9 sm:w-9'
                    aria-label={t('cart.table.removeAria', { title: displayTitle })}
                  >
                    <Trash className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
