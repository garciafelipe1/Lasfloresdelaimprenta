import { cartService } from '@/services/cart.service';
import { MobileHeaderContent } from './mobile-header-content';

export async function MobileHeader() {
  const cart = await cartService.getCart();

  return <MobileHeaderContent cart={cart} />;
}
