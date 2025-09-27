import { cartService } from '@/services/cart.service';
import { actionClient } from '../safe-action';

export const cartActionClient = actionClient.use(async ({ next }) => {
  const cart = await cartService.getOrSetCart('ar');
  return next({ ctx: { cart } });
});
