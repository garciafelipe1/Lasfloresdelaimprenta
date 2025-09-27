/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import { cookies } from '@/lib/data/cookies';
import { getRegion } from '@/lib/data/regions';
import { medusa } from '@/lib/medusa-client';
import { StoreShippingOptionListResponse } from '@medusajs/types';

export const cartService = {
  async getCart(cartId?: string) {
    const id = cartId || (await cookies.getCartId());

    if (!id) {
      return null;
    }

    // const headers = {
    //   ...(await getAuthHeaders()),
    // };

    // const next = {
    //   ...(await getCacheOptions('carts')),
    // };

    const { cart } = await medusa.store.cart.retrieve(
      id,
      {
        fields:
          '*items, *region, *items.product, *items.variant, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name, *items.product.categories',
      },
      {
        next: {
          tags: [`cart-${id}`],
        },
      },
    );
    return cart;
  },

  async getOrSetCart(countryCode: string) {
    const region = await getRegion(countryCode);

    if (!region) {
      throw new Error(`Region not found for country code: ${countryCode}`);
    }

    let cart = await this.getCart();

    // const headers = {
    //   ...(await getAuthHeaders()),
    // };

    if (!cart) {
      const cartResp = await medusa.store.cart.create({
        region_id: region.id,
      });

      cart = cartResp.cart;

      await cookies.setCartId(cart.id);

      // const cartCacheTag = await getCacheTag('carts');
      // revalidateTag(cartCacheTag);
    }

    if (cart && cart?.region_id !== region.id) {
      await medusa.store.cart.update(cart.id, { region_id: region.id });
      // const cartCacheTag = await getCacheTag('carts');
      // revalidateTag(cartCacheTag);
    }

    return cart;
  },

  async getShippingOptions(): Promise<GetShippingOptions> {
    const cart = await this.getCart();

    if (!cart) {
      throw new Error('Cart doesnt exist');
    }

    const data = await medusa.store.fulfillment.listCartOptions({
      cart_id: cart!.id,
      fields: '+type.code',
    });

    const pricesMap: Record<string, number> = {};

    data.shipping_options.forEach((so) => {
      if (so.price_type === 'flat') {
        pricesMap[so.id] = so.amount;
      }
    });

    const promises = data.shipping_options
      .filter((sm) => sm.price_type === 'calculated')
      .map((sm) => this.calculatePriceForShippingOption({ optionId: sm.id }));

    Promise.allSettled(promises).then((res) => {
      res
        .filter((r) => r.status === 'fulfilled')
        .forEach((p) => (pricesMap[p.value?.id || ''] = p.value?.amount!));
    });

    return {
      shippingOptions: data.shipping_options,
      pricesMap,
    };
  },

  async calculatePriceForShippingOption({
    optionId,
  }: CalculatePriceForShippingOption) {
    const cart = await this.getCart();

    if (!cart) {
      throw new Error('Cart doesnt exist');
    }

    const data = await medusa.store.fulfillment.calculate(optionId, {
      cart_id: cart.id,
    });

    return data.shipping_option;
  },
};

type CalculatePriceForShippingOption = {
  optionId: string;
};

export type GetShippingOptions = {
  pricesMap: Record<string, number>;
  shippingOptions: StoreShippingOptionListResponse['shipping_options'];
};
