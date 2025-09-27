'use server';

import { medusa } from '@/lib/medusa-client';
import { cartActionClient } from '@/lib/next-safe-action/cart-action-client';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

const addToCartSchema = z.object({
  quantity: z.number(),
  variantId: z.string(),
});

export const addToCartAction = cartActionClient
  .schema(addToCartSchema)
  .action(async ({ parsedInput: { quantity, variantId }, ctx: { cart } }) => {
    try {
      await medusa.store.cart.createLineItem(cart.id, {
        variant_id: variantId,
        quantity,
      });
      revalidateTag(`cart-${cart.id}`);
    } catch (error) {
      console.error({ error });
      throw new Error('Error al agregar al carrito');
    }
  });
