import { cartService } from '@/services/cart.service';
import { ShoppingCart } from '../../shopping-cart/shopping-cart';
import { MobileMenu } from './mobile-menu';
import { MobileThemedLogo } from './mobile-themed-logo';

export async function MobileHeader() {
  const cart = await cartService.getCart();

  return (
    <div className='flex items-center justify-between py-2'>
      <MobileMenu />
      <MobileThemedLogo />
      <ShoppingCart cart={cart} />
    </div>
  );
}
