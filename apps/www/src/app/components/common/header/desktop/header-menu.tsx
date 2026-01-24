import { Button } from '@/components/ui/button';
import { cartService } from '@/services/cart.service';
import { UserCircleIcon } from 'lucide-react';
import Link from 'next/link';
import { ModeToggle } from '../../../ui/mode-toggle';
import { ShoppingCart } from '../../shopping-cart/shopping-cart';
import { SearchBar } from './search-bar';

export async function HeaderMenu() {
  const cart = await cartService.getCart();

  return (
    <div className='flex items-center gap-2 lg:translate-x-1'>
      <SearchBar />
      <ShoppingCart cart={cart} />
      <Link href='/login'>
        <Button
          variant='outline'
          size='icon'
        >
          <UserCircleIcon className='h-5 w-5 text-primary' />
          <span className='sr-only'>Usuario</span>
        </Button>
      </Link>
      <ModeToggle />
    </div>
  );
}
