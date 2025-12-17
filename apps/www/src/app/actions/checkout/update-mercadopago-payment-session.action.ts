'use server';

import { medusa } from '@/lib/medusa-client';

/**
 * Asegura que el carrito tenga una sesión de pago de MercadoPago antes de completar
 * 
 * Este action se llama desde la página de success para asegurar que haya
 * una sesión de pago de MercadoPago antes de completar el carrito.
 */
export async function ensureMercadoPagoPaymentSession(cartId: string) {
  try {
    console.log('[EnsurePaymentSession] Verificando sesión de pago para carrito:', cartId);

    // Obtener el carrito con las sesiones de pago
    const cartResponse = await medusa.store.cart.retrieve(cartId, {
      fields: 'payment_collection.payment_sessions.*',
    });

    if (!cartResponse.cart) {
      throw new Error('Carrito no encontrado');
    }

    const cart = cartResponse.cart;

    // Buscar la sesión de pago de MercadoPago
    let paymentSession = cart.payment_collection?.payment_sessions?.find(
      (session) => session.provider_id?.startsWith('pp_mercadopago_')
    );

    // Si no existe, crear una nueva sesión de pago
    if (!paymentSession) {
      console.log('[EnsurePaymentSession] No se encontró sesión, creando una nueva...');
      
      // Obtener los providers disponibles
      const providersResponse = await medusa.store.payment.listPaymentProviders({
        region_id: cart.region_id,
      });

      // Buscar el provider de MercadoPago
      const mercadoPagoProvider = providersResponse.payment_providers?.find(
        (provider) => provider.id?.startsWith('pp_mercadopago_')
      );

      if (!mercadoPagoProvider) {
        throw new Error('Provider de MercadoPago no encontrado');
      }

      // Crear la sesión de pago
      await medusa.store.payment.initiatePaymentSession(cartId, {
        provider_id: mercadoPagoProvider.id,
      });

      // Obtener el carrito actualizado
      const updatedCartResponse = await medusa.store.cart.retrieve(cartId, {
        fields: 'payment_collection.payment_sessions.*',
      });

      paymentSession = updatedCartResponse.cart?.payment_collection?.payment_sessions?.find(
        (session) => session.provider_id?.startsWith('pp_mercadopago_')
      );

      if (!paymentSession) {
        throw new Error('No se pudo crear la sesión de pago');
      }

      console.log('[EnsurePaymentSession] Sesión de pago creada:', paymentSession.id);
    } else {
      console.log('[EnsurePaymentSession] Sesión de pago existente:', paymentSession.id);
    }

    return {
      success: true,
      paymentSessionId: paymentSession.id,
    };
  } catch (error: any) {
    console.error('[EnsurePaymentSession] Error:', error);
    return {
      success: false,
      error: error.message || 'Error al asegurar sesión de pago',
    };
  }
}

