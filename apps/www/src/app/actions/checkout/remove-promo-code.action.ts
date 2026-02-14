'use server';

import { medusa } from '@/lib/medusa-client';
import { cartActionClient } from '@/lib/next-safe-action/cart-action-client';
import { revalidateTag } from 'next/cache';

/**
 * Quita los códigos promocionales del carrito.
 * Usa cart.update con promo_codes vacío (el Store API acepta promo_codes en el body de update).
 */
export const removePromoCodeAction = cartActionClient.action(
  async ({ ctx: { cart } }) => {
    await medusa.store.cart.update(cart.id, { promo_codes: [] } as any);
    revalidateTag(`cart-${cart.id}`);
  }
);
