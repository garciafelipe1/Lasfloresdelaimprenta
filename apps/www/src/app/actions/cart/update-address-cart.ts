'use server';

import medusaError from '@/app/helpers/medusa-error';
import { medusa } from '@/lib/medusa-client';
import { cartActionClient } from '@/lib/next-safe-action/cart-action-client';
import { checkoutAddressSchema } from '@/lib/zod/checkout-address-schema';
import { revalidateTag } from 'next/cache';

export const updateAddressCartAction = cartActionClient
  .schema(checkoutAddressSchema)
  .action(
    async ({
      parsedInput: {
        phoneNumber,
        postalCode,
        firstName,
        lastName,
        province,
        address,
        city,
        email,
      },
      ctx: { cart },
    }) => {
      const aux = {
        country_code: cart.region?.countries?.[0].iso_2,
        postal_code: postalCode,
        first_name: firstName,
        last_name: lastName,
        address_1: address,
        phone: phoneNumber,
        province,
        city,
      };

      try {
        await medusa.store.cart.update(cart.id, {
          billing_address: aux,
          shipping_address: aux,
          email,
          metadata: {
            locale: 'es',
          },
        });
        revalidateTag(`cart-${cart.id}`);
      } catch (error) {
        console.error({ error });
        medusaError(error);
      }
    },
  );
