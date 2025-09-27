import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { formatARS } from 'utils';
import { Button } from '../../ui/button';

interface Props {
  totalPrice: number;
}

export function ShoppingCartFooter({ totalPrice }: Props) {
  return (
    <div className='sticky bottom-0 flex w-full flex-col gap-4 border-t p-8'>
      <header className='flex items-center justify-between px-4'>
        <div className='text-lg font-semibold'>TOTAL</div>
        <div className='text-lg font-semibold'>{formatARS(totalPrice)}</div>
      </header>
      <Link href='/checkout/cart'>
        <Button
          variant='outline'
          className='w-full'
        >
          Finalizar Compra
        </Button>
      </Link>

      <Link
        href='/catalog'
        className=''
      >
        <Button className='w-full'>
          <ChevronLeft />
          <span>Seguir comprando</span>
        </Button>
      </Link>
    </div>
  );
}
