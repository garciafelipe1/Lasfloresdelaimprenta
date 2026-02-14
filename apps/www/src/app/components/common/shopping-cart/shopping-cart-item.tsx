'use client';

import { removeFromCartAction } from '@/app/actions/cart/remove-from-cart.action';
import { Button } from '@/components/ui/button';
import { getSafeImageUrl } from '@/lib/get-safe-image-url';
import { formatMoneyByLocale } from '@/lib/money-formatter';
import { cn } from '@/lib/utils';
import { StoreCartLineItem } from '@medusajs/types';
import { Trash } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import Image from 'next/image';
import { ComponentProps, PropsWithChildren } from 'react';
import { toast } from 'sonner';

interface Props {
  item: StoreCartLineItem;
}

export function ShoppingCartItem({ item }: Props) {
  const locale = useLocale();
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
  const imageUrl = getSafeImageUrl(item.product?.thumbnail ?? '');
  const meta = (item as any).metadata as
    | { preparado?: string; indicaciones?: string; dedicatoria?: string }
    | undefined;
  const removeItem = useAction(removeFromCartAction, {
    onError() {
      toast.error('Hubo un error al eliminar el producto');
    },
    onSuccess() {
      console.log('PRODUCTO ELIMINADO');
    },
  });

  return (
    <div className='flex items-start gap-3 rounded-md border p-3 sm:items-center sm:space-x-4 sm:p-4'>
      <ItemImage
        alt={displayTitle}
        src={imageUrl}
        quantity={item.quantity}
      />

      <div className='min-w-0 flex-1'>
        <h6 className='m-0 break-words text-primary text-sm sm:text-base'>{displayTitle}</h6>
        {variantTitle ? (
          <p className='mt-1 text-xs text-muted-foreground'>
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
        <p className='mt-0 text-sm text-primary'>
          {formatMoneyByLocale(item.unit_price, locale)}
        </p>
      </div>

      <Button
        onClick={() => removeItem.execute({ variantId: item.id! })}
        className='h-9 w-9 shrink-0 hover:bg-destructive/20 sm:h-10 sm:w-10'
        variant='outline'
        size='icon'
        aria-label={`Remove ${displayTitle}`}
      >
        <Trash className='text-primary h-4 w-4' />
      </Button>
    </div>
  );
}

type ItemRoot = ComponentProps<'div'>;

export function ItemRoot({ className, ...props }: ItemRoot) {
  return (
    <div
      {...props}
      className={cn(
        'flex items-start gap-3 rounded-md border p-3 sm:items-center sm:space-x-4 sm:p-4',
        className,
      )}
    />
  );
}

type ItemImageProps = {
  alt: string;
  src: string;
  quantity: number;
};

export function ItemImage(props: ItemImageProps) {
  return (
    <div className='relative h-20 w-20'>
      <span className='bg-foreground text-background absolute top-[-4px] right-[-4px] z-10 flex h-5 w-5 items-center justify-center rounded-full p-1 text-xs'>
        {props.quantity}
      </span>
      <Image
        alt={props.alt ?? 'Shopping item image'}
        className='h-full w-full rounded-md object-cover'
        src={getSafeImageUrl(props.src)}
        fill
      />
    </div>
  );
}

interface ItemBodyProps extends PropsWithChildren {
  title: string;
  price: number;
}

export function ItemBody({ title, price, children }: ItemBodyProps) {
  const locale = useLocale();
  return (
    <div className='min-w-0 flex-1'>
      <h6 className='m-0 break-words text-sm sm:text-base'>{title}</h6>
      <p className='m-0 text-sm text-gray-500'>{formatMoneyByLocale(price, locale)}</p>
      {children}
    </div>
  );
}
