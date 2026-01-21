/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import { cookies } from '@/lib/data/cookies';
import { getRegion } from '@/lib/data/regions';
import { medusa } from '@/lib/medusa-client';
import { StoreShippingOptionListResponse } from '@medusajs/types';
import { getCurrencyFromLocale } from '@/lib/currency';

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

  async getOrSetCart(countryCode: string, locale?: string) {
    const region = await getRegion(countryCode);

    if (!region) {
      throw new Error(`Region not found for country code: ${countryCode}`);
    }

    // Obtener moneda esperada según el locale
    const expectedCurrency = getCurrencyFromLocale(locale || 'es');

    let cart = await this.getCart();

    // const headers = {
    //   ...(await getAuthHeaders()),
    // };

    // Si el carrito existe, verificar si está completado
    // Un carrito completado no puede ser modificado
    if (cart) {
      try {
        // Intentar recuperar el carrito con campos adicionales para verificar su estado
        // Si el carrito está completado, Medusa puede lanzar un error o el carrito tendrá completed_at
        const cartCheck = await medusa.store.cart.retrieve(cart.id, {
          fields: 'id',
        });
        
        // Si llegamos aquí sin error, el carrito existe y no está completado (o al menos podemos intentar usarlo)
        // Si el carrito está completado, el error se capturará cuando intentemos modificarlo
      } catch (error: any) {
        // Si el error indica que el carrito está completado o no existe, crear uno nuevo
        if (
          error?.message?.includes('already completed') || 
          error?.message?.includes('completed') ||
          error?.message?.includes('not found') ||
          error?.status === 404
        ) {
          console.log('[CartService] Carrito completado o no encontrado, creando nuevo carrito...');
          await cookies.removeCartId();
          cart = null; // Forzar creación de nuevo carrito
        } else {
          // Si es otro error, relanzarlo
          throw error;
        }
      }
    }

    if (!cart) {
      const cartResp = await medusa.store.cart.create({
        region_id: region.id,
        currency_code: expectedCurrency, // ✅ Crear carrito con moneda según locale
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
