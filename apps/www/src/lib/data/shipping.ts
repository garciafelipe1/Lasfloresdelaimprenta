'use server';

import { medusa } from '../medusa-client';

type Options = {
  optionId: string;
  cartId: string;
  data?: Record<string, unknown>;
};

export async function calculatePriceForShippingOption({
  cartId,
  optionId,
  data,
}: Options) {
  // const headers = {
  //   ...(await cookies.getAuthHeaders()),
  // };

  // const next = {
  //   ...(await getCacheOptions('fulfillment')),
  // };

  const body = { cart_id: cartId, data };

  if (data) {
    body.data = data;
  }

  const response = await medusa.store.fulfillment.calculate(optionId, {
    cart_id: cartId,
  });

  return response.shipping_option;

  // return medusa.client
  //   .fetch<{ shipping_option: StoreCartShippingOption }>(
  //     `/store/shipping-options/${optionId}/calculate`,
  //     {
  //       method: 'POST',
  //       body,
  //       headers,
  //       // next,
  //     },
  //   )
  //   .then(({ shipping_option }) => shipping_option)
  //   .catch((e) => {
  //     return null;
  //   });
}
