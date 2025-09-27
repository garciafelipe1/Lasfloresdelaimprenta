import { removeFromCartAction } from '@/app/actions/cart/remove-from-cart.action';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StoreCartLineItem } from '@medusajs/types';
import { Trash } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import Image from 'next/image';
import { ComponentProps, PropsWithChildren } from 'react';
import { toast } from 'sonner';
import { formatARS } from 'utils';

interface Props {
  item: StoreCartLineItem;
}

export function ShoppingCartItem({ item }: Props) {
  const imageUrl = item.product?.thumbnail ?? '';
  const removeItem = useAction(removeFromCartAction, {
    onError() {
      toast.error('Hubo un error al eliminar el producto');
    },
    onSuccess() {
      console.log('PRODUCTO ELIMINADO');
    },
  });

  return (
    <div className='flex items-center space-x-4 rounded-md border p-4'>
      <ItemImage
        alt={item.title}
        src={imageUrl}
        quantity={item.quantity}
      />

      <div className='flex-1'>
        <h6 className='m-0'>{item.title}</h6>
        <p className='mt-0 text-sm text-gray-500'>
          {formatARS(item.unit_price)}
        </p>
      </div>

      <Button
        onClick={() => removeItem.execute({ variantId: item.id! })}
        className='hover:bg-destructive/20'
        variant='outline'
        size='icon'
        aria-label={`Remove ${item.title}`}
      >
        <Trash />
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
        'flex items-center space-x-4 rounded-md border p-4',
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
        src={props.src}
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
  return (
    <div className='flex-1'>
      <h6 className='m-0'>{title}</h6>
      <p className='m-0 text-sm text-gray-500'>{formatARS(price)}</p>
      {children}
    </div>
  );
}
