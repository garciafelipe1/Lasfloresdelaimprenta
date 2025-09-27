'use server';

import { medusa } from '@/lib/medusa-client';
import { cartActionClient } from '@/lib/next-safe-action/cart-action-client';
import { updateItemMessageSchema } from '@/lib/zod/update-item-message-schema';
import { revalidateTag } from 'next/cache';

export const upateItemMessageAction = cartActionClient
  .schema(updateItemMessageSchema)
  .action(
    async ({ parsedInput: { message, itemId, quantity }, ctx: { cart } }) => {
      try {
        await medusa.store.cart.updateLineItem(cart.id, itemId, {
          quantity,
          metadata: {
            message,
          },
        });
        revalidateTag(`cart-${cart.id}`);
      } catch (error) {
        console.error({ error });
        throw new Error('Error al actualizar el mensaje del producto');
      }
    },
  );
