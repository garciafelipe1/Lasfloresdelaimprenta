'use server';

import { medusa } from '@/lib/medusa-client';
import { cartActionClient } from '@/lib/next-safe-action/cart-action-client';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

const setShippingMethod = z.object({
  optionId: z.string(),
});

export const setShippingMethodAction = cartActionClient
  .schema(setShippingMethod)
  .action(async ({ parsedInput: { optionId }, ctx: { cart } }) => {
    try {
      await medusa.store.cart.addShippingMethod(cart.id, {
        option_id: optionId,
      });
      revalidateTag(`cart-${cart.id}`);
    } catch (error) {
      console.error({ error });
      throw new Error('Error al establecer el método de envío');
    }
  });
