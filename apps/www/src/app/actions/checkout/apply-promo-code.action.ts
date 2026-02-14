'use server';

import { cartActionClient } from '@/lib/next-safe-action/cart-action-client';
import { medusa } from '@/lib/medusa-client';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

const schema = z.object({
  promoCode: z.string().min(1).max(50).transform((s) => s.trim().toUpperCase()),
});

/**
 * Aplica un código promocional al carrito.
 * Usa el Store API PUT directamente para aplicar los códigos promocionales.
 * Esto activa los workflows de Medusa que calculan los descuentos automáticamente.
 */
export const applyPromoCodeAction = cartActionClient.schema(schema).action(
  async ({ parsedInput: { promoCode }, ctx: { cart } }) => {
    try {
      // Obtener códigos promocionales actuales del carrito
      const currentCart = await medusa.store.cart.retrieve(cart.id, {
        fields: 'promotions',
      });

      // Obtener códigos ya aplicados
      const existingCodes = (currentCart.cart as any).promotions?.map((p: any) => p.code).filter(Boolean) || [];

      // Si el código ya está aplicado, no hacer nada
      if (existingCodes.includes(promoCode)) {
        const updatedCart = await medusa.store.cart.retrieve(cart.id);
        revalidateTag(`cart-${cart.id}`);
        return { cart: updatedCart.cart };
      }

      // Agregar el nuevo código a la lista
      const newPromoCodes = [...existingCodes, promoCode];

      // Usar el Store API PUT para actualizar el carrito con los códigos promocionales
      // Esto activa los workflows de Medusa que calculan los descuentos
      const updated = await medusa.store.cart.update(cart.id, {
        promo_codes: newPromoCodes,
      } as any);

      // Log para debugging
      console.log('[Apply Promo] Código aplicado:', {
        promoCode,
        cartId: cart.id,
        promotions: updated.cart.promotions,
        discountTotal: (updated.cart as any).discount_total,
        total: updated.cart.total,
        itemSubtotal: updated.cart.item_subtotal,
        shippingTotal: updated.cart.shipping_total,
        calculatedDiscount: updated.cart.item_subtotal && updated.cart.shipping_total && updated.cart.total
          ? (updated.cart.item_subtotal + updated.cart.shipping_total - updated.cart.total)
          : 0,
      });

      revalidateTag(`cart-${cart.id}`);
      return { cart: updated.cart };
    } catch (error: any) {
      const message = error?.message || error?.toString() || '';
      const messageLower = message.toLowerCase();

      // Detectar diferentes tipos de errores
      if (
        messageLower.includes('limit') ||
        messageLower.includes('used') ||
        messageLower.includes('invalid') ||
        messageLower.includes('not found') ||
        messageLower.includes('does not exist')
      ) {
        throw new Error('invalid_or_used');
      }

      // Si la promoción está inactiva
      if (messageLower.includes('inactive') || messageLower.includes('not active')) {
        throw new Error('inactive');
      }

      console.error('[Apply Promo] Error:', error);
      throw new Error('generic');
    }
  }
);
