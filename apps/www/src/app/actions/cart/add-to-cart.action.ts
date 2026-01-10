'use server';

import { medusa } from '@/lib/medusa-client';
import { cartActionClient } from '@/lib/next-safe-action/cart-action-client';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

const addToCartSchema = z.object({
  quantity: z.number(),
  variantId: z.string(),
});

export const addToCartAction = cartActionClient
  .schema(addToCartSchema)
  .action(async ({ parsedInput: { quantity, variantId }, ctx: { cart } }) => {
    try {
      await medusa.store.cart.createLineItem(cart.id, {
        variant_id: variantId,
        quantity,
      });
      revalidateTag(`cart-${cart.id}`);
    } catch (error: any) {
      console.error('[AddToCart] Error al agregar producto:', error);
      
      // Si el error indica que el carrito está completado, crear un nuevo carrito e intentar de nuevo
      if (error?.message?.includes('already completed') || error?.message?.includes('completed')) {
        console.log('[AddToCart] Carrito completado detectado, creando nuevo carrito...');
        
        // Limpiar la cookie del carrito completado
        const { cookies } = await import('@/lib/data/cookies');
        await cookies.removeCartId();
        
        // Obtener la región del carrito anterior para crear uno nuevo en la misma región
        const regionId = cart.region_id;
        
        // Crear un nuevo carrito
        const newCartResp = await medusa.store.cart.create({
          region_id: regionId,
        });
        
        // Guardar el nuevo carrito en la cookie
        await cookies.setCartId(newCartResp.cart.id);
        
        // Intentar añadir el producto al nuevo carrito
        await medusa.store.cart.createLineItem(newCartResp.cart.id, {
          variant_id: variantId,
          quantity,
        });
        
        revalidateTag(`cart-${newCartResp.cart.id}`);
        console.log('[AddToCart] Producto añadido al nuevo carrito exitosamente');
      } else {
        // Si es otro error, lanzarlo normalmente
      throw new Error('Error al agregar al carrito');
      }
    }
  });
