'use server';

import { medusa } from '@/lib/medusa-client';
import { cartActionClient } from '@/lib/next-safe-action/cart-action-client';
import { z } from 'zod';

const initiatePaymentSessionSchema = z.object({
  providerId: z.string(),
});

export const initiatePaymentSessionAction = cartActionClient
  .schema(initiatePaymentSessionSchema)
  .action(async ({ parsedInput: { providerId }, ctx: { cart } }) => {
    try {
      await medusa.store.payment.initiatePaymentSession(cart, {
        provider_id: providerId,
      });
    } catch (error) {
      console.error({ error });
      throw new Error('Error al establecer el método de envío');
    }
  });
