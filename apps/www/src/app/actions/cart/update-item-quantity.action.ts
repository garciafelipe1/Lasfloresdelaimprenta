'use server';

import medusaError from '@/app/helpers/medusa-error';
import { medusa } from '@/lib/medusa-client';
import { cartActionClient } from '@/lib/next-safe-action/cart-action-client';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

const updateItemQuantitySchema = z.object({
  itemId: z.string(),
  quantity: z.number(),
});

export const upateItemQuantityAction = cartActionClient
  .schema(updateItemQuantitySchema)
  .action(async ({ parsedInput: { itemId, quantity }, ctx: { cart } }) => {
    try {
      await medusa.store.cart.updateLineItem(cart.id, itemId, {
        quantity,
      });
      revalidateTag(`cart-${cart.id}`);
    } catch (error) {
      console.error({ error });
      medusaError(error);
    }
  });
