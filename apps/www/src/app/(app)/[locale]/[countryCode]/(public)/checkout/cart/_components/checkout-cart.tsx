import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { StoreCart } from '@medusajs/types';
import Link from 'next/link';
import { formatARS } from 'utils';
import { CheckoutProductsTable } from './checkout-products-table';

interface Props {
  cart: StoreCart;
}

export function CheckoutCart({ cart }: Props) {
  return (
    <div className='grid grid-cols-1 gap-8 sm:grid-cols-[1fr_300px]'>
      <CheckoutProductsTable items={cart.items ?? []} />
      <Card className='bg-secondary h-fit'>
        <CardHeader>
          <CardTitle className='text-primary text-center'>
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='py-4'>
            <div className='flex items-center justify-between'>
              <p className='text-sm'>Subtotal</p>
              <span className='text-sm font-semibold'>
                {formatARS(cart.item_subtotal)}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <p className='text-sm'>Shipping</p>
              <span className='text-sm text-gray-500'>To be calculated</span>
            </div>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-semibold'>Total</p>
              <span className='text-lg font-bold'>{formatARS(cart.total)}</span>
            </div>
          </div>

          <Link href='/checkout/address'>
            <Button className='text-secondary w-full'>
              Proceed to Checkout
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
