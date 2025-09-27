'use server';

import { medusa } from '@/lib/medusa-client';
import { cartActionClient } from '@/lib/next-safe-action/cart-action-client';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

const removeFromCartSchema = z.object({
  variantId: z.string(),
});

export const removeFromCartAction = cartActionClient
  .schema(removeFromCartSchema)
  .action(async ({ parsedInput: { variantId }, ctx: { cart } }) => {
    try {
      await medusa.store.cart.deleteLineItem(cart.id, variantId);
      revalidateTag(`cart-${cart.id}`);
    } catch (error) {
      console.error({ error });
      throw new Error('Error al agregar al carrito');
    }
  });
