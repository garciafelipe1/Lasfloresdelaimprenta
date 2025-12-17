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
    try {
      console.log('[MP] ========== INICIO DE CREACIÓN DE PREFERENCIA ==========');
      console.log('[MP] Iniciando creación de preferencia de MercadoPago');
      console.log('[MP] Cart ID:', cart.id);
      console.log('[MP] Cart object (partial):', JSON.stringify({
        id: cart.id,
        email: cart.email,
        total: cart.total,
        shipping_total: cart.shipping_total,
        items_count: cart.items?.length,
      }, null, 2));

      // PASO 0: Asegurar que existe una sesión de pago de MercadoPago
      // Esto es crítico para que el plugin pueda procesar el pago cuando se complete el carrito
      console.log('[MP] Verificando/creando sesión de pago de MercadoPago...');
      try {
        // Obtener el carrito con sesiones de pago
        const cartWithSessions = await medusa.store.cart.retrieve(cart.id, {
          fields: 'payment_collection.payment_sessions.*',
        });

        let paymentSession = cartWithSessions.cart?.payment_collection?.payment_sessions?.find(
          (session) => session.provider_id?.startsWith('pp_mercadopago_')
        );

        // Si no existe, crear una nueva sesión de pago
        if (!paymentSession) {
          console.log('[MP] No se encontró sesión de pago, creando una nueva...');
          
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

          console.log('[MP] Provider de MercadoPago encontrado:', mercadoPagoProvider.id);

          // Crear la sesión de pago
          // Nota: En Medusa v2, initiatePaymentSession espera el objeto cart completo, no el cartId
          await medusa.store.payment.initiatePaymentSession(cart, {
            provider_id: mercadoPagoProvider.id,
          });

          console.log('[MP] Sesión de pago de MercadoPago creada exitosamente');
        } else {
          console.log('[MP] Sesión de pago de MercadoPago ya existe:', paymentSession.id);
        }
      } catch (sessionError: any) {
        console.error('[MP] Error al crear/verificar sesión de pago:', sessionError);
        // Continuar de todas formas, pero registrar el error
        console.warn('[MP] Continuando sin sesión de pago (puede causar problemas al completar el carrito)');
      }
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
        // Removido 'items.variant.calculated_price.*' porque requiere currency_code en el contexto
        // y estamos usando item.total / item.quantity para obtener el precio unitario
        'items.total',
        'items.unit_price',
        'items.quantity',
        'shipping_address.*',
        'billing_address.*',
        'email',
        'region.*',
        'region.countries.*',
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
        console.error('[MP] Datos del carrito disponibles:', {
          hasEmail: !!cartData.email,
          hasShippingAddress: !!cartData.shipping_address,
          hasBillingAddress: !!cartData.billing_address,
          email: cartData.email,
        });
        throw new Error('Es necesario completar el email antes de continuar con el pago. Por favor, volvé al paso anterior y completá tus datos.');
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cartData.email)) {
        console.error('[MP] ERROR: Email con formato inválido:', cartData.email);
        throw new Error('El email ingresado no es válido. Por favor, verificá tus datos.');
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
        // Obtener el precio del item
        // En Medusa, los precios pueden venir en diferentes campos:
        // - item.unit_price: precio unitario (puede estar en centavos o no)
        // - item.total: total del item (precio unitario * cantidad)
        // - item.variant.calculated_price: precio calculado del variant
        
        // Intentar obtener el precio del total del item dividido por la cantidad
        // Esto es más confiable que unit_price que puede no estar correctamente calculado
        let unitPrice = 0;
        
        console.log('[MP] Datos del item para calcular precio:', {
          itemId: item.id,
          itemTotal: item.total,
          itemQuantity: item.quantity,
          itemUnitPrice: item.unit_price,
          variantCalculatedPrice: item.variant?.calculated_price?.calculated_amount,
        });
        
        // CORRECCIÓN: Los valores que llegan de Medusa con los fields solicitados
        // ya están en formato que MercadoPago espera (no necesitan división por 100)
        // El problema reportado indica que 24000 llega como 240, lo cual sugiere
        // que los valores YA están en el formato correcto o necesitan un tratamiento diferente
        
        if (item.total && item.quantity && item.quantity > 0) {
          // Calculamos el precio unitario: total / cantidad
          // item.total ya viene en el formato correcto para MercadoPago
          unitPrice = Number(item.total) / Number(item.quantity);
          console.log('[MP] Precio unitario calculado desde total:', unitPrice);
        } else if (item.unit_price) {
          // unit_price ya viene en el formato correcto
          unitPrice = Number(item.unit_price);
          console.log('[MP] Precio unitario desde unit_price:', unitPrice);
        } else if (item.variant?.calculated_price?.calculated_amount) {
          // calculated_price viene en formato decimal
          unitPrice = Number(item.variant.calculated_price.calculated_amount);
          console.log('[MP] Precio unitario desde variant:', unitPrice);
        }
        
        // unitPrice ya está en el formato que MercadoPago espera
        const unitPriceDecimal = Number(unitPrice.toFixed(2));
        
        console.log('[MP] Precio final calculado:', {
          unitPrice,
          unitPriceDecimal,
          itemTotal: item.total,
          itemQuantity: item.quantity,
        });

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
        // shipping_total ya viene en el formato correcto
        const shippingDecimal = Number(cartData.shipping_total);
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
      // cart.total ya viene en el formato correcto
      const cartTotal = Number(cartData.total);
      
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
        identification?: {
          type?: string;
          number?: string;
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
        console.log('[MP] Procesando teléfono:', payerPhone);
        const phoneClean = payerPhone.replace(/\D/g, ''); // Solo números
        console.log('[MP] Teléfono limpio (solo números):', phoneClean);
        
        // Para Argentina: formato +54 (código país) + código de área (2-4 dígitos) + número (6-8 dígitos)
        // Ejemplo: +542914397685 -> código país: 54, área: 291, número: 4397685
        if (phoneClean.length >= 10) {
          let areaCode: string | undefined;
          let number: string | undefined;
          
          // Si empieza con 54 (código de país de Argentina), lo removemos
          if (phoneClean.startsWith('54') && phoneClean.length > 10) {
            const withoutCountryCode = phoneClean.substring(2);
            console.log('[MP] Teléfono sin código de país:', withoutCountryCode);
            
            // El código de área en Argentina puede ser 2, 3 o 4 dígitos
            // Intentamos detectar el código de área más común (2-3 dígitos)
            // Los códigos de área comunes en Argentina son: 11 (CABA), 291 (Bahía Blanca), etc.
            if (withoutCountryCode.length >= 8) {
              // Intentamos con 3 dígitos primero (más común)
              if (withoutCountryCode.length >= 9) {
                areaCode = withoutCountryCode.substring(0, 3);
                number = withoutCountryCode.substring(3);
              } else {
                // Si tiene 8 dígitos, usamos 2 dígitos para el área
                areaCode = withoutCountryCode.substring(0, 2);
                number = withoutCountryCode.substring(2);
              }
            }
          } else {
            // Si no tiene código de país, asumimos que ya está en formato local
            // Intentamos con 3 dígitos para el área (más común en Argentina)
            if (phoneClean.length >= 9) {
              areaCode = phoneClean.substring(0, 3);
              number = phoneClean.substring(3);
            } else if (phoneClean.length >= 8) {
              areaCode = phoneClean.substring(0, 2);
              number = phoneClean.substring(2);
            }
          }
          
          console.log('[MP] Teléfono procesado:', { areaCode, number });
          
          if (areaCode && number) {
            payerData.phone = {
              area_code: areaCode,
              number: number,
            };
            console.log('[MP] Teléfono agregado al payer:', payerData.phone);
          } else {
            console.warn('[MP] ADVERTENCIA: No se pudo procesar el teléfono correctamente');
          }
        } else {
          console.warn('[MP] ADVERTENCIA: El teléfono es demasiado corto:', phoneClean);
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

      // Validación final del objeto payer antes de enviar
      console.log('[MP] Objeto payer final antes de enviar:', JSON.stringify(payerData, null, 2));
      console.log('[MP] Datos completos del carrito para payer:', {
        hasEmail: !!cartData.email,
        hasBillingAddress: !!cartData.billing_address,
        hasShippingAddress: !!cartData.shipping_address,
        billingFirstName: cartData.billing_address?.first_name,
        billingLastName: cartData.billing_address?.last_name,
        billingPhone: cartData.billing_address?.phone,
        shippingFirstName: cartData.shipping_address?.first_name,
        shippingLastName: cartData.shipping_address?.last_name,
        shippingPhone: cartData.shipping_address?.phone,
        billingAddress: cartData.billing_address?.address_1,
        shippingAddress: cartData.shipping_address?.address_1,
        billingPostalCode: cartData.billing_address?.postal_code,
        shippingPostalCode: cartData.shipping_address?.postal_code,
      });
      
      if (!payerData.email || !emailRegex.test(payerData.email)) {
        throw new Error('El email es requerido y debe tener un formato válido para procesar el pago.');
      }
      
      // Advertencia si faltan datos importantes para MercadoPago
      if (!payerData.name || !payerData.surname) {
        console.warn('[MP] ADVERTENCIA: Faltan nombre o apellido del comprador. MercadoPago puede deshabilitar el botón de pago.');
      }
      if (!payerData.phone) {
        console.warn('[MP] ADVERTENCIA: Falta el teléfono del comprador. MercadoPago puede deshabilitar el botón de pago.');
      }

      const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const medusaBackendUrl = process.env.MEDUSA_BACKEND_URL;

      // Limpiar la URL para evitar dobles barras
      const cleanAppUrl = appUrl.replace(/\/+$/, '');

      // Obtener locale y countryCode del carrito completo o usar valores por defecto
      // El cartActionClient usa 'ar' por defecto, y el locale por defecto es 'es'
      const countryCodeFromCart = cartData.region?.countries?.[0]?.iso_2 || 
                                  cart.region?.countries?.[0]?.iso_2 || 
                                  'ar';
      const locale = 'es'; // Por ahora siempre 'es' para Argentina
      const countryCode = countryCodeFromCart;

      console.log('[MP] Configuración de URLs:', {
        appUrl,
        cleanAppUrl,
        locale,
        countryCode,
        countryCodeFromCart,
        hasRegion: !!cartData.region,
        hasCountries: !!cartData.region?.countries,
        countriesCount: cartData.region?.countries?.length || 0,
        medusaBackendUrl,
        hasNotificationUrl: !!medusaBackendUrl,
      });

      const preferenceBody = {
        items,
        payer: payerData,
        back_urls: {
          success: `${cleanAppUrl}/${locale}/${countryCode}/checkout/success`,
          failure: `${cleanAppUrl}/${locale}/${countryCode}/checkout/failure`,
          pending: `${cleanAppUrl}/${locale}/${countryCode}/checkout/pending`,
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
      payerPhone: preferenceBody.payer.phone,
      hasPayerAddress: !!preferenceBody.payer.address,
      payerAddress: preferenceBody.payer.address,
      external_reference: preferenceBody.external_reference,
      hasNotificationUrl: !!preferenceBody.notification_url,
      back_urls: preferenceBody.back_urls,
    });
    
    // Log detallado de items
    console.log('[MP] Items detallados:', JSON.stringify(preferenceBody.items, null, 2));
    
    // Log completo del objeto payer que se enviará
    console.log('[MP] PAYER COMPLETO que se enviará a MercadoPago:', JSON.stringify(preferenceBody.payer, null, 2));
    
    // Validar que todos los items tengan datos válidos
    const invalidItems = preferenceBody.items.filter(item => 
      !item.id || !item.title || item.quantity <= 0 || item.unit_price <= 0
    );
    if (invalidItems.length > 0) {
      console.error('[MP] ERROR: Items inválidos encontrados:', invalidItems);
      throw new Error('Algunos productos tienen datos inválidos. Por favor, intentá nuevamente.');
    }
    
    // Advertencia si faltan datos importantes del payer
    const missingPayerData = [];
    if (!preferenceBody.payer.name) missingPayerData.push('nombre');
    if (!preferenceBody.payer.surname) missingPayerData.push('apellido');
    if (!preferenceBody.payer.phone) missingPayerData.push('teléfono');
    
    if (missingPayerData.length > 0) {
      console.warn('[MP] ADVERTENCIA: Faltan datos del comprador:', missingPayerData.join(', '));
      console.warn('[MP] MercadoPago puede deshabilitar el botón de pago si faltan estos datos.');
      console.warn('[MP] Asegurate de que el usuario complete todos los datos en el paso de dirección.');
    }

    // Crear la preferencia de pago
    let preference;
    try {
      preference = await new Preference(mercadoPagoClient).create({
        body: preferenceBody,
      });
    } catch (mpError: any) {
      console.error('[MP] ERROR al crear preferencia en MercadoPago API');
      console.error('[MP] Error de MercadoPago:', {
        message: mpError?.message,
        status: mpError?.status,
        statusCode: mpError?.statusCode,
        cause: mpError?.cause,
      });
      
      // Intentar obtener más detalles del error
      if (mpError?.cause) {
        console.error('[MP] Error cause:', JSON.stringify(mpError.cause, null, 2));
      }
      
      if (mpError?.response) {
        console.error('[MP] Error response:', {
          status: mpError.response.status,
          statusText: mpError.response.statusText,
          data: mpError.response.data,
        });
      }
      
      throw new Error(
        mpError?.message || 
        mpError?.cause?.message || 
        'No se pudo crear la preferencia de pago en MercadoPago. Por favor, verificá tus datos e intentá nuevamente.'
      );
    }

    console.log('[MP] Respuesta de MercadoPago:', {
      hasPreference: !!preference,
      preferenceId: preference.id,
      hasInitPoint: !!preference.init_point,
      initPoint: preference.init_point?.substring(0, 50) + '...',
      status: preference.status,
      payer: preference.payer,
      items: preference.items?.length,
    });

    if (!preference.init_point) {
      console.error('[MP] ERROR: La preferencia no tiene init_point');
      console.error('[MP] Respuesta completa de MercadoPago:', JSON.stringify(preference, null, 2));
      
      // Verificar si hay errores en la respuesta
      if (preference.status === 'rejected' || preference.status === 'cancelled') {
        throw new Error(`La preferencia fue ${preference.status}. Por favor, verificá tus datos e intentá nuevamente.`);
      }
      
      throw new Error('No se pudo crear la preferencia de pago. MercadoPago no devolvió una URL de pago válida.');
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
