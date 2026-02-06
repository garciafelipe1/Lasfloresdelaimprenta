'use client';

import { removeFromCartAction } from '@/app/actions/cart/remove-from-cart.action';
import { upateItemQuantityAction } from '@/app/actions/cart/update-item-quantity.action';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
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
    <Card className='h-fit flex-1 overflow-auto p-4'>
      <div className='grid grid-cols-[min(100%,120px)_1fr_min(100%,120px)_min(100%,120px)_min(100%,150px)_min-content] items-center gap-4 py-2 text-sm text-gray-500'>
        <span className='text-primary'>{t('cart.table.product')}</span>
        <span></span> {/* For product details */}
        <div className='text-primary ml-18 text-left'>{t('cart.table.price')}</div>
        <div className='text-primary text-center'>{t('cart.table.quantity')}</div>
        <div className='text-primary mr-16 text-right'>
          {t('cart.table.total')}
        </div> <span></span> {/* For remove icon */}
      </div>
      {items?.map((item) => (
        (() => {
          const productTitle =
            ((item as any).product?.title as string | undefined) ||
            ((item as any).variant?.product?.title as string | undefined);
          const displayTitle = productTitle || item.title;
          const variantTitle = item.title && item.title !== displayTitle ? item.title : null;
          const meta = (item as any).metadata as
            | { preparado?: string; indicaciones?: string; dedicatoria?: string }
            | undefined;

          return (
            <div
              key={item.id}
              className='grid grid-cols-[min(100%,120px)_1fr_min(100%,120px)_min(100%,120px)_min(100%,150px)_min-content] items-center gap-4 border-t py-4 text-center'
            >
              {item.thumbnail && (
                <div className='relative h-20 w-20 overflow-hidden rounded-md'>
                  <Image
                    src={item.thumbnail}
                    objectFit='cover'
                    alt={displayTitle}
                    fill
                  />
                </div>
              )}

              <div>
                <h3 className='text-primary mb-8 text-sm font-semibold'>
                  {displayTitle}
                </h3>
                {variantTitle ? (
                  <p className='-mt-6 text-xs text-muted-foreground text-left'>
                    Variante: {variantTitle}
                  </p>
                ) : null}
                {meta?.preparado ? (
                  <p className='mt-1 text-xs text-muted-foreground text-left'>
                    Preparado: {meta.preparado}
                  </p>
                ) : null}
                {meta?.dedicatoria ? (
                  <p className='mt-1 text-xs text-muted-foreground text-left'>
                    Dedicatoria: {meta.dedicatoria}
                  </p>
                ) : null}
                {meta?.indicaciones ? (
                  <p className='mt-1 text-xs text-muted-foreground text-left'>
                    Indicaciones: {meta.indicaciones}
                  </p>
                ) : null}
              </div>

              <div className='text-primary text-right text-sm'>
                {formatMoneyByLocale(item.unit_price, locale)}
              </div>

              <div className='flex items-center justify-center space-x-2'>
                <Button
                  disabled={updateQuantity.isExecuting || item.quantity === 1}
                  className='bg-secondary text-primary hover:bg-primary/40'
                  size='sm'
                  onClick={() => handleDecreaseItemQuantity(item.id)}
                >
                  -
                </Button>
                <span className='text-primary text-sm'>{item.quantity}</span>
                <Button
                  disabled={updateQuantity.isExecuting}
                  className='bg-secondary text-primary hover:bg-primary/40'
                  size='sm'
                  onClick={() => handleIncreaseItemQuantity(item.id)}
                >
                  +
                </Button>
              </div>

              <div className='flex items-center justify-end'>
                <div className='mr-2 text-right text-sm font-semibold'>
                  {formatMoneyByLocale(item.unit_price * item.quantity, locale)}
                </div>
                <Button
                  onClick={() => removeItem.execute({ variantId: item.id! })}
                  variant='outline'
                  size='icon'
                  aria-label={t('cart.table.removeAria', { title: displayTitle })}
                >
                  <Trash />
                </Button>
              </div>
            </div>
          );
        })()
      ))}
    </Card>
  );
}
