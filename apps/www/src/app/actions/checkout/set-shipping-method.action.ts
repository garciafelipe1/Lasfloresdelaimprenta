'use server';

import { medusa } from '@/lib/medusa-client';
import { cartActionClient } from '@/lib/next-safe-action/cart-action-client';
import { isPeakShippingActive } from '@/lib/peak-shipping';
import { BAHIA_BLANCA_SHIPPING_CODES } from '@server/constants';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

const setShippingMethod = z.object({
  optionId: z.string(),
});

export const setShippingMethodAction = cartActionClient
  .schema(setShippingMethod)
  .action(async ({ parsedInput: { optionId }, ctx: { cart } }) => {
    try {
      // Guard server-side: identificar el tipo de shipping option por ID
      const opts = await medusa.store.fulfillment.listCartOptions({
        cart_id: cart.id,
        fields: '+type.code',
      });

      const selected = opts.shipping_options?.find((o) => o?.id === optionId);
      const selectedCode = (selected as unknown as { type?: { code?: string } })?.type?.code;
      const isConfirm =
        selectedCode === BAHIA_BLANCA_SHIPPING_CODES.envioAConfirmar;

      if (isConfirm) {
        if (!isPeakShippingActive()) {
          throw new Error('Envío a confirmar no está disponible fuera de fechas pico.');
        }
      }

      await medusa.store.cart.addShippingMethod(cart.id, {
        option_id: optionId,
      });

      // Persistir flags para auditar el caso "a confirmar"
      const meta =
        cart.metadata && typeof cart.metadata === 'object'
          ? (cart.metadata as Record<string, unknown>)
          : {};
      await medusa.store.cart.update(cart.id, {
        metadata: {
          ...meta,
          shipping_to_confirm: isConfirm ? true : false,
          // Se podría guardar una marca de cuándo se eligió, sin requerir confirmaciones extra.
          shipping_to_confirm_selected_at: isConfirm ? new Date().toISOString() : null,
        },
      });

      revalidateTag(`cart-${cart.id}`);
    } catch (error) {
      console.error({ error });
      throw new Error('Error al establecer el método de envío');
    }
  });
