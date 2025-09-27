'use server';

import medusaError from '@/app/helpers/medusa-error';
import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { cartActionClient } from '@/lib/next-safe-action/cart-action-client';
import { StoreCompleteCartResponse } from '@medusajs/types';
import { redirect } from 'next/navigation';

export const placeOrderAction = cartActionClient.action(
  async ({ ctx: { cart } }) => {
    let cartRes: StoreCompleteCartResponse;

    try {
      cartRes = await medusa.store.cart.complete(cart.id);
    } catch (error) {
      medusaError(error);
    }

    if (cartRes?.type === 'order') {
      cookies.removeCartId();
      redirect(`/order/${cartRes?.order.display_id}/confirmed`);
    }

    return cartRes.cart;
  },
);
