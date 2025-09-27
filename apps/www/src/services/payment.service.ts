/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import { medusa } from '@/lib/medusa-client';
import { StoreCart } from '@medusajs/types';

export const paymentService = {
  async listAvailablePaymentProviders({ cart }: ListAvailablePaymentProviders) {
    const data = await medusa.store.payment.listPaymentProviders({
      region_id: cart?.region_id!,
    });

    return data.payment_providers;
  },
};

type ListAvailablePaymentProviders = {
  cart: StoreCart;
};
