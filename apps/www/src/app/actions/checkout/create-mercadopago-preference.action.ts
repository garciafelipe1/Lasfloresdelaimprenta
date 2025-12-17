'use server';

import { medusa } from '@/lib/medusa-client';
import { mercadoPagoClient } from '@/lib/mp-client';
import { Preference } from 'mercadopago';

/**
 * Crea una preferencia de pago en MercadoPago y retorna la URL de pago
 * 
 * Este action crea una preferencia de pago con los items del carrito
 * y retorna la URL de pago de MercadoPago para que el cliente haga el redirect.
 */
export async function createMercadoPagoPreference(cartId: string): Promise<string> {
  console.log('[MP] Iniciando creación de preferencia de MercadoPago');
  console.log('[MP] Cart ID:', cartId);
  
  try {
    // Verificar que tenemos el access token
    const accessToken = process.env.MP_ACCESS_TOKEN || 
                       process.env.MERCADOPAGO_ACCESS_TOKEN || 
                       process.env.MERCADO_PAGO_TOKEN;
    
    if (!accessToken) {
      console.error('[MP] ERROR: No se encontró el access token de MercadoPago');
      throw new Error('Configuración de MercadoPago incompleta');
    }
    
    console.log('[MP] Access token encontrado:', accessToken.substring(0, 10) + '...');
    
    // Obtener el carrito completo con todos los datos necesarios
    console.log('[MP] Obteniendo carrito de Medusa...');
    const cart = await medusa.store.cart.retrieve(cartId, {
      fields: [
        'id',
        'total',
        'shipping_total',
        'currency_code',
        'items.*',
        'items.variant.*',
        'items.variant.product.*',
        'shipping_address.*',
        'billing_address.*',
        'email',
        'region.*',
      ],
    });

    console.log('[MP] Respuesta de Medusa:', {
      hasCart: !!cart.cart,
      cartId: cart.cart?.id,
      itemsCount: cart.cart?.items?.length || 0,
      total: cart.cart?.total,
      currency: cart.cart?.currency_code,
    });

    if (!cart.cart) {
      console.error('[MP] ERROR: Carrito no encontrado en la respuesta');
      throw new Error('Carrito no encontrado');
    }

    const cartData = cart.cart;

    // Preparar los items para la preferencia de MercadoPago
    console.log('[MP] Preparando items del carrito...');
    console.log('[MP] Items del carrito:', cartData.items?.map(item => ({
      id: item.id,
      variant_id: item.variant_id,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })));
    
    const items = cartData.items?.map((item) => {
      // Obtener el precio del item (los precios en Medusa están en centavos)
      const unitPrice = item.unit_price || 0;
      const unitPriceDecimal = Number(unitPrice) / 100;

      console.log('[MP] Procesando item:', {
        id: item.variant_id || item.id,
        title: item.variant?.product?.title || item.title,
        unitPrice,
        unitPriceDecimal,
        quantity: item.quantity,
      });

      return {
        id: item.variant_id || item.id,
        title: item.variant?.product?.title || item.title || 'Producto',
        description:
          item.variant?.product?.description?.substring(0, 250) ||
          item.variant?.title ||
          'Sin descripción',
        quantity: item.quantity || 1,
        unit_price: unitPriceDecimal, // MercadoPago espera el precio en formato decimal (ARS)
        currency_id: cartData.currency_code?.toUpperCase() || 'ARS',
      };
    }) || [];

    // Agregar el costo de envío como un item adicional si existe
    if (cartData.shipping_total && cartData.shipping_total > 0) {
      console.log('[MP] Agregando costo de envío:', {
        shipping_total: cartData.shipping_total,
        shipping_total_decimal: Number(cartData.shipping_total) / 100,
      });
      items.push({
        id: 'shipping',
        title: 'Costo de envío',
        description: 'Gastos de envío',
        quantity: 1,
        unit_price: Number(cartData.shipping_total) / 100,
        currency_id: cartData.currency_code?.toUpperCase() || 'ARS',
      });
    }

    console.log('[MP] Items preparados para MercadoPago:', items);

    // Si no hay items, lanzar error
    if (items.length === 0) {
      console.error('[MP] ERROR: El carrito está vacío');
      throw new Error('El carrito está vacío');
    }

    // Preparar datos del payer
    const payerData = {
      email: cartData.email || undefined,
      name:
        cartData.billing_address?.first_name ||
        cartData.shipping_address?.first_name ||
        undefined,
      surname:
        cartData.billing_address?.last_name ||
        cartData.shipping_address?.last_name ||
        undefined,
      phone: {
        area_code:
          cartData.billing_address?.phone?.substring(0, 3) ||
          cartData.shipping_address?.phone?.substring(0, 3) ||
          undefined,
        number:
          cartData.billing_address?.phone?.substring(3) ||
          cartData.shipping_address?.phone?.substring(3) ||
          undefined,
      },
      address: {
        street_name:
          cartData.billing_address?.address_1 ||
          cartData.shipping_address?.address_1 ||
          undefined,
        street_number: undefined,
        zip_code:
          cartData.billing_address?.postal_code ||
          cartData.shipping_address?.postal_code ||
          undefined,
      },
    };

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const medusaBackendUrl = process.env.MEDUSA_BACKEND_URL;

    console.log('[MP] Configuración de URLs:', {
      appUrl,
      medusaBackendUrl,
      hasNotificationUrl: !!medusaBackendUrl,
    });

    const preferenceBody = {
      items,
      payer: payerData,
      back_urls: {
        success: `${appUrl}/checkout/success`,
        failure: `${appUrl}/checkout/failure`,
        pending: `${appUrl}/checkout/pending`,
      },
      auto_return: 'approved' as const,
      external_reference: cartId,
      metadata: {
        cart_id: cartId,
        order_type: 'checkout',
      },
      notification_url: medusaBackendUrl
        ? `${medusaBackendUrl}/store/mercadopago/webhook`
        : undefined,
    };

    console.log('[MP] Creando preferencia en MercadoPago...');
    console.log('[MP] Datos de la preferencia:', {
      itemsCount: preferenceBody.items.length,
      payerEmail: preferenceBody.payer.email,
      external_reference: preferenceBody.external_reference,
      hasNotificationUrl: !!preferenceBody.notification_url,
    });

    // Crear la preferencia de pago
    const preference = await new Preference(mercadoPagoClient).create({
      body: preferenceBody,
    });

    console.log('[MP] Respuesta de MercadoPago:', {
      hasPreference: !!preference,
      preferenceId: preference.id,
      hasInitPoint: !!preference.init_point,
      initPoint: preference.init_point?.substring(0, 50) + '...',
      status: preference.status,
    });

    if (!preference.init_point) {
      console.error('[MP] ERROR: La preferencia no tiene init_point');
      console.error('[MP] Respuesta completa:', JSON.stringify(preference, null, 2));
      throw new Error('No se pudo crear la preferencia de pago');
    }

    console.log('[MP] Preferencia creada exitosamente');
    console.log('[MP] URL de pago:', preference.init_point);

    // Retornar la URL de pago para que el cliente haga el redirect
    return preference.init_point;
  } catch (error: any) {
    console.error('[MP] ERROR al crear preferencia de MercadoPago');
    console.error('[MP] Tipo de error:', error?.constructor?.name);
    console.error('[MP] Mensaje de error:', error?.message);
    console.error('[MP] Stack trace:', error?.stack);
    console.error('[MP] Cart ID:', cartId);
    console.error('[MP] Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Si es un error de MercadoPago, incluir más detalles
    if (error.response) {
      console.error('[MP] MercadoPago API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }
    
    if (error.cause) {
      console.error('[MP] Error cause:', error.cause);
    }
    
    // Proporcionar un mensaje de error más descriptivo
    let errorMessage = 'No se pudo procesar el pago. Por favor, intentá nuevamente.';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.response?.data?.message) {
      errorMessage = `Error de MercadoPago: ${error.response.data.message}`;
    } else if (error.response?.status) {
      errorMessage = `Error de MercadoPago (${error.response.status}): ${error.response.statusText || 'Error desconocido'}`;
    }
    
    console.error('[MP] Mensaje de error final:', errorMessage);
    
    throw new Error(errorMessage);
  }
}

