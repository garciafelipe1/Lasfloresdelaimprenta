import { cartService } from '@/services/cart.service';
import { actionClient } from '../safe-action';
import { getLocale } from '../get-locale';

export const cartActionClient = actionClient.use(async ({ next }) => {
  const locale = await getLocale();
  const cart = await cartService.getOrSetCart('ar', locale); // ✅ Pasar locale para moneda correcta
  return next({ ctx: { cart } });
});
