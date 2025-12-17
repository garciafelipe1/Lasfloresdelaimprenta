'use server';

import { medusa } from '@/lib/medusa-client';
import { cartActionClient } from '@/lib/next-safe-action/cart-action-client';
import { mercadoPagoClient } from '@/lib/mp-client';
import { Preference } from 'mercadopago';
import { z } from 'zod';

/**
 * Crea una preferencia de pago en MercadoPago y retorna la URL de pago
 * 
 * Este action crea una preferencia de pago con los items del carrito
 * y retorna la URL de pago de MercadoPago para que el cliente haga el redirect.
 */
const createMercadoPagoPreferenceSchema = z.void();

export const createMercadoPagoPreference = cartActionClient
  .schema(createMercadoPagoPreferenceSchema)
  .action(async ({ ctx: { cart } }) => {
    console.log('[MP] ========== INICIO DE CREACIÓN DE PREFERENCIA ==========');
    console.log('[MP] Iniciando creación de preferencia de MercadoPago');
    console.log('[MP] Cart ID:', cart.id);
    console.log('[MP] Cart object:', JSON.stringify(cart, null, 2));
    
    try {
      console.log('[MP] Verificando mercadoPagoClient...');
      console.log('[MP] mercadoPagoClient existe:', !!mercadoPagoClient);
      console.log('[MP] Tipo de mercadoPagoClient:', typeof mercadoPagoClient);
      
      // Verificar que tenemos el access token desde las variables de entorno
      console.log('[MP] Verificando access token...');
      console.log('[MP] MP_ACCESS_TOKEN existe:', !!process.env.MP_ACCESS_TOKEN);
      console.log('[MP] MERCADOPAGO_ACCESS_TOKEN existe:', !!process.env.MERCADOPAGO_ACCESS_TOKEN);
      console.log('[MP] MERCADO_PAGO_TOKEN existe:', !!process.env.MERCADO_PAGO_TOKEN);
      
      const accessToken = process.env.MP_ACCESS_TOKEN || 
                         process.env.MERCADOPAGO_ACCESS_TOKEN || 
                         process.env.MERCADO_PAGO_TOKEN;
      
      console.log('[MP] Access token encontrado:', !!accessToken);
      
      if (!accessToken) {
        console.error('[MP] ERROR: No se encontró el access token de MercadoPago en ninguna variable de entorno');
        const mpEnvVars = Object.keys(process.env).filter(k => 
          k.includes('MP') || k.includes('MERCADO') || k.includes('MERCADOPAGO')
        );
        console.error('[MP] Variables de entorno relacionadas disponibles:', mpEnvVars);
        throw new Error('Configuración de MercadoPago incompleta: No se encontró el access token');
      }
      
      console.log('[MP] Access token encontrado (primeros 10 caracteres):', accessToken.substring(0, 10) + '...');
      
      // Obtener el carrito completo con todos los datos necesarios
      console.log('[MP] Obteniendo carrito completo de Medusa...');
      // Medusa espera fields como string separado por comas, no como array
      const fieldsString = [
        'id',
        'total',
        'item_subtotal',
        'shipping_total',
        'currency_code',
        'items.*',
        'items.variant.*',
        'items.variant.product.*',
        'items.total',
        'items.unit_price',
        'items.quantity',
        'shipping_address.*',
        'billing_address.*',
        'email',
        'region.*',
      ].join(',');
      
      console.log('[MP] Fields string:', fieldsString);
      
      const cartResponse = await medusa.store.cart.retrieve(cart.id, {
        fields: fieldsString,
      });

      console.log('[MP] Respuesta de Medusa:', {
        hasCart: !!cartResponse.cart,
        cartId: cartResponse.cart?.id,
        itemsCount: cartResponse.cart?.items?.length || 0,
        total: cartResponse.cart?.total,
        currency: cartResponse.cart?.currency_code,
      });

      if (!cartResponse.cart) {
        console.error('[MP] ERROR: Carrito no encontrado en la respuesta');
        throw new Error('Carrito no encontrado');
      }

      const cartData = cartResponse.cart;

      // Validar que el email esté presente (requerido por MercadoPago)
      if (!cartData.email) {
        console.error('[MP] ERROR: El carrito no tiene email asociado');
        throw new Error('Es necesario completar el email antes de continuar con el pago');
      }

      // Validar que haya items en el carrito
      if (!cartData.items || cartData.items.length === 0) {
        console.error('[MP] ERROR: El carrito está vacío');
        throw new Error('El carrito está vacío');
      }

      // Preparar los items para la preferencia de MercadoPago
      console.log('[MP] Preparando items del carrito...');
      console.log('[MP] Items del carrito:', cartData.items.map(item => ({
        id: item.id,
        variant_id: item.variant_id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      })));
      
      const items = cartData.items.map((item) => {
        // Obtener el precio del item (los precios en Medusa están en centavos)
        const unitPrice = item.unit_price || 0;
        const unitPriceDecimal = Number(unitPrice) / 100;

        // Validar que el precio sea válido
        if (unitPriceDecimal <= 0) {
          console.error('[MP] ERROR: Item con precio inválido:', {
            id: item.id,
            title: item.title,
            unitPrice,
            unitPriceDecimal,
          });
          throw new Error(`El producto "${item.title || 'Sin título'}" tiene un precio inválido`);
        }

        console.log('[MP] Procesando item:', {
          id: item.variant_id || item.id,
          title: item.variant?.product?.title || item.title,
          unitPrice,
          unitPriceDecimal,
          quantity: item.quantity,
        });

        return {
          id: String(item.variant_id || item.id),
          title: (item.variant?.product?.title || item.title || 'Producto').substring(0, 256),
          description: (
            item.variant?.product?.description?.substring(0, 250) ||
            item.variant?.title ||
            item.title ||
            'Sin descripción'
          ).substring(0, 256),
          quantity: Number(item.quantity) || 1,
          unit_price: Number(unitPriceDecimal.toFixed(2)), // MercadoPago espera el precio en formato decimal (ARS)
          currency_id: cartData.currency_code?.toUpperCase() || 'ARS',
        };
      });

      // Agregar el costo de envío como un item adicional si existe
      if (cartData.shipping_total && cartData.shipping_total > 0) {
        const shippingDecimal = Number(cartData.shipping_total) / 100;
        console.log('[MP] Agregando costo de envío:', {
          shipping_total: cartData.shipping_total,
          shipping_total_decimal: shippingDecimal,
        });
        items.push({
          id: 'shipping',
          title: 'Costo de envío',
          description: 'Gastos de envío',
          quantity: 1,
          unit_price: Number(shippingDecimal.toFixed(2)),
          currency_id: cartData.currency_code?.toUpperCase() || 'ARS',
        });
      }

      // Calcular el total de los items para validar
      const itemsTotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const cartTotal = Number(cartData.total) / 100;
      
      console.log('[MP] Validación de totales:', {
        itemsTotal: itemsTotal.toFixed(2),
        cartTotal: cartTotal.toFixed(2),
        diferencia: Math.abs(itemsTotal - cartTotal).toFixed(2),
      });

      console.log('[MP] Items preparados para MercadoPago:', items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: (item.unit_price * item.quantity).toFixed(2),
      })));

      // Preparar datos del payer (MercadoPago requiere email para habilitar el botón)
      const payerEmail = cartData.email;
      const payerFirstName = cartData.billing_address?.first_name || cartData.shipping_address?.first_name;
      const payerLastName = cartData.billing_address?.last_name || cartData.shipping_address?.last_name;
      const payerPhone = cartData.billing_address?.phone || cartData.shipping_address?.phone;

      console.log('[MP] Datos del payer:', {
        email: payerEmail,
        firstName: payerFirstName,
        lastName: payerLastName,
        phone: payerPhone,
      });

      // Construir objeto payer con validaciones
      const payerData: {
        email: string;
        name?: string;
        surname?: string;
        phone?: {
          area_code?: string;
          number?: string;
        };
        address?: {
          street_name?: string;
          street_number?: string;
          zip_code?: string;
        };
      } = {
        email: payerEmail, // Requerido por MercadoPago
      };

      if (payerFirstName) {
        payerData.name = payerFirstName;
      }

      if (payerLastName) {
        payerData.surname = payerLastName;
      }

      // Procesar teléfono si existe
      if (payerPhone) {
        const phoneClean = payerPhone.replace(/\D/g, ''); // Solo números
        if (phoneClean.length >= 10) {
          payerData.phone = {
            area_code: phoneClean.substring(0, 3) || undefined,
            number: phoneClean.substring(3) || undefined,
          };
        }
      }

      // Procesar dirección si existe
      const address = cartData.billing_address?.address_1 || cartData.shipping_address?.address_1;
      const postalCode = cartData.billing_address?.postal_code || cartData.shipping_address?.postal_code;
      
      if (address || postalCode) {
        payerData.address = {};
        if (address) {
          payerData.address.street_name = address;
        }
        if (postalCode) {
          payerData.address.zip_code = postalCode;
        }
      }

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
      external_reference: cart.id,
      metadata: {
        cart_id: cart.id,
        order_type: 'checkout',
      },
      notification_url: medusaBackendUrl
        ? `${medusaBackendUrl}/store/mercadopago/webhook`
        : undefined,
      statement_descriptor: 'La Florería de la Imprenta', // Descripción que aparece en el resumen de tarjeta
    };

    console.log('[MP] Creando preferencia en MercadoPago...');
    console.log('[MP] Datos de la preferencia:', {
      itemsCount: preferenceBody.items.length,
      itemsTotal: itemsTotal.toFixed(2),
      payerEmail: preferenceBody.payer.email,
      payerName: preferenceBody.payer.name,
      payerSurname: preferenceBody.payer.surname,
      hasPayerPhone: !!preferenceBody.payer.phone,
      external_reference: preferenceBody.external_reference,
      hasNotificationUrl: !!preferenceBody.notification_url,
      back_urls: preferenceBody.back_urls,
    });
    
    // Log detallado de items
    console.log('[MP] Items detallados:', JSON.stringify(preferenceBody.items, null, 2));

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
    console.error('[MP] Cart ID:', cart.id);
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
});
