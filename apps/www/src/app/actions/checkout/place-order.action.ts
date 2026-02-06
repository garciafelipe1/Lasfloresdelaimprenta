'use server';

import medusaError from '@/app/helpers/medusa-error';
import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { cartActionClient } from '@/lib/next-safe-action/cart-action-client';
import { BAHIA_BLANCA_SHIPPING_CODES } from '@server/constants';
import { StoreCompleteCartResponse } from '@medusajs/types';
import { redirect } from 'next/navigation';

export const placeOrderAction = cartActionClient.action(
  async ({ ctx: { cart } }) => {
    let cartRes: StoreCompleteCartResponse;
    // Pre-chequeo: si el método seleccionado es "Envío a confirmar"
    let isShippingToConfirm = false;

    try {
      try {
        const pre = await medusa.store.cart.retrieve(cart.id, {
          fields:
            'id,metadata,shipping_address.*,shipping_methods.*,shipping_methods.shipping_option.*,shipping_methods.shipping_option.type.*',
        });

        type ShippingMethodLike = {
          shipping_option?: { type?: { code?: string } };
        };

        const firstShipping = (pre.cart.shipping_methods?.[0] ??
          undefined) as unknown as ShippingMethodLike | undefined;
        const shippingTypeCode = firstShipping?.shipping_option?.type?.code;

        isShippingToConfirm =
          shippingTypeCode === BAHIA_BLANCA_SHIPPING_CODES.envioAConfirmar ||
          Boolean(
            (pre.cart.metadata as Record<string, unknown> | null | undefined)
              ?.shipping_to_confirm,
          );
      } catch {
        // Si falla el retrieve, seguimos con flujo normal.
      }

      cartRes = await medusa.store.cart.complete(cart.id);
    } catch (error) {
      medusaError(error);
    }

    if (cartRes?.type === 'order') {
      cookies.removeCartId();

      const qs = isShippingToConfirm ? '?shipping=confirm' : '';
      redirect(`/order/${cartRes?.order.display_id}/confirmed${qs}`);
    }

    return cartRes.cart;
  },
);
