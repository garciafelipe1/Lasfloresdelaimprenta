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
    console.log('[EnsurePaymentSession] ========== INICIO ==========');
    console.log('[EnsurePaymentSession] Verificando sesión de pago para carrito:', cartId);

    // Obtener el carrito con las sesiones de pago
    console.log('[EnsurePaymentSession] Obteniendo carrito de Medusa...');
    const cartResponse = await medusa.store.cart.retrieve(cartId, {
      fields: 'payment_collection.payment_sessions.*',
    });

    if (!cartResponse.cart) {
      console.error('[EnsurePaymentSession] ❌ Carrito no encontrado');
      throw new Error('Carrito no encontrado');
    }

    const cart = cartResponse.cart;
    console.log('[EnsurePaymentSession] ✅ Carrito obtenido:', {
      cartId: cart.id,
      hasPaymentCollection: !!cart.payment_collection,
      paymentSessionsCount: cart.payment_collection?.payment_sessions?.length || 0,
    });

    // Buscar la sesión de pago de MercadoPago
    let paymentSession = cart.payment_collection?.payment_sessions?.find(
      (session) => session.provider_id?.startsWith('pp_mercadopago_')
    );

    console.log('[EnsurePaymentSession] Sesiones de pago encontradas:', {
      total: cart.payment_collection?.payment_sessions?.length || 0,
      mercadopagoSession: paymentSession ? {
        id: paymentSession.id,
        provider_id: paymentSession.provider_id,
        status: paymentSession.status,
      } : null,
    });

    // Si no existe, crear una nueva sesión de pago
    if (!paymentSession) {
      console.log('[EnsurePaymentSession] ⚠️ No se encontró sesión de MercadoPago, creando una nueva...');
      
      // Obtener los providers disponibles
      console.log('[EnsurePaymentSession] Obteniendo providers de pago para región:', cart.region_id);
      const providersResponse = await medusa.store.payment.listPaymentProviders({
        region_id: cart.region_id,
      });

      console.log('[EnsurePaymentSession] Providers disponibles:', {
        count: providersResponse.payment_providers?.length || 0,
        providers: providersResponse.payment_providers?.map(p => ({
          id: p.id,
          is_enabled: p.is_enabled,
        })),
      });

      // Buscar el provider de MercadoPago
      const mercadoPagoProvider = providersResponse.payment_providers?.find(
        (provider) => provider.id?.startsWith('pp_mercadopago_')
      );

      if (!mercadoPagoProvider) {
        console.error('[EnsurePaymentSession] ❌ Provider de MercadoPago no encontrado');
        throw new Error('Provider de MercadoPago no encontrado');
      }

      console.log('[EnsurePaymentSession] ✅ Provider de MercadoPago encontrado:', {
        id: mercadoPagoProvider.id,
        is_enabled: mercadoPagoProvider.is_enabled,
      });

      // Crear la sesión de pago
      // Nota: En Medusa v2, initiatePaymentSession espera el objeto cart completo, no el cartId
      console.log('[EnsurePaymentSession] Creando sesión de pago con cart object (no cartId)...');
      try {
        await medusa.store.payment.initiatePaymentSession(cart, {
          provider_id: mercadoPagoProvider.id,
        });
        console.log('[EnsurePaymentSession] ✅ Llamada a initiatePaymentSession completada sin errores');
      } catch (initError: any) {
        console.error('[EnsurePaymentSession] ❌ Error al crear sesión de pago:', {
          message: initError?.message,
          status: initError?.response?.status,
          statusText: initError?.response?.statusText,
          data: initError?.response?.data,
        });
        throw initError;
      }

      // Obtener el carrito actualizado
      console.log('[EnsurePaymentSession] Obteniendo carrito actualizado para verificar sesión creada...');
      const updatedCartResponse = await medusa.store.cart.retrieve(cartId, {
        fields: 'payment_collection.payment_sessions.*',
      });

      paymentSession = updatedCartResponse.cart?.payment_collection?.payment_sessions?.find(
        (session) => session.provider_id?.startsWith('pp_mercadopago_')
      );

      if (!paymentSession) {
        console.error('[EnsurePaymentSession] ❌ No se pudo crear la sesión de pago - no aparece en el carrito actualizado');
        throw new Error('No se pudo crear la sesión de pago');
      }

      console.log('[EnsurePaymentSession] ✅ Sesión de pago creada exitosamente:', {
        id: paymentSession.id,
        provider_id: paymentSession.provider_id,
        status: paymentSession.status,
      });
    } else {
      console.log('[EnsurePaymentSession] ✅ Sesión de pago existente encontrada:', {
        id: paymentSession.id,
        provider_id: paymentSession.provider_id,
        status: paymentSession.status,
      });
    }

    console.log('[EnsurePaymentSession] ========== FIN - ÉXITO ==========');
    return {
      success: true,
      paymentSessionId: paymentSession.id,
    };
  } catch (error: any) {
    console.error('[EnsurePaymentSession] ========== FIN - ERROR ==========');
    console.error('[EnsurePaymentSession] Error completo:', {
      message: error?.message,
      stack: error?.stack,
      response: error?.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      } : undefined,
    });
    return {
      success: false,
      error: error.message || 'Error al asegurar sesión de pago',
    };
  }
}

