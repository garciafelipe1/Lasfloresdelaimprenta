import { redirect } from 'next/navigation';
import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
import { ensureMercadoPagoPaymentSession } from '@/app/actions/checkout/update-mercadopago-payment-session.action';
import { BAHIA_BLANCA_SHIPPING_CODES } from '@server/constants';

interface Props {
  params: Promise<{
    locale: string;
    countryCode: string;
  }>;
  searchParams: Promise<{
    collection_id?: string;
    collection_status?: string;
    payment_id?: string;
    status?: string;
    external_reference?: string;
    payment_type?: string;
    merchant_order_id?: string;
    preference_id?: string;
  }>;
}

export default async function CheckoutSuccessPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { external_reference, collection_status, payment_id, status } = searchParams;

  console.log('[CheckoutSuccess] ========== INICIO DE PÁGINA DE ÉXITO ==========');
  console.log('[CheckoutSuccess] Parámetros recibidos:', JSON.stringify(searchParams, null, 2));

  // Obtener información del método de envío antes de completar el carrito
  let shippingMessage = 'Te enviaremos un correo con los detalles de tu pedido. Si tenés alguna duda, no dudes en contactarnos.';
  
  // El mensaje de envío se establecerá después de recuperar el carrito actualizado

  // Si tenemos un external_reference (cart_id) y el pago fue aprobado, intentar completar el carrito
  if (external_reference && collection_status === 'approved' && status === 'approved') {
    console.log('[CheckoutSuccess] ✅ Condiciones cumplidas para completar carrito');
    console.log('[CheckoutSuccess]   - external_reference:', external_reference);
    console.log('[CheckoutSuccess]   - collection_status:', collection_status);
    console.log('[CheckoutSuccess]   - status:', status);
    console.log('[CheckoutSuccess]   - payment_id:', payment_id);
    console.log('[CheckoutSuccess] Intentando completar carrito:', external_reference);
    
    try {
      
      // Paso 1: Asegurar que existe una sesión de pago de MercadoPago
      console.log('[CheckoutSuccess] ========== PASO 1: ASEGURAR SESIÓN DE PAGO ==========');
      console.log('[CheckoutSuccess] Asegurando sesión de pago de MercadoPago...');
      console.log('[CheckoutSuccess] cartId:', external_reference);
      
      let sessionResult;
      try {
        sessionResult = await ensureMercadoPagoPaymentSession(external_reference);
        console.log('[CheckoutSuccess] ✅ ensureMercadoPagoPaymentSession completado');
        console.log('[CheckoutSuccess] Resultado:', JSON.stringify(sessionResult, null, 2));
      } catch (ensureError: any) {
        console.error('[CheckoutSuccess] ❌ Error al llamar ensureMercadoPagoPaymentSession:');
        console.error('[CheckoutSuccess] Tipo:', ensureError?.constructor?.name);
        console.error('[CheckoutSuccess] Mensaje:', ensureError?.message);
        console.error('[CheckoutSuccess] Stack:', ensureError?.stack);
        throw new Error(`Error al asegurar sesión de pago: ${ensureError?.message || 'Error desconocido'}`);
      }
      
      if (!sessionResult || !sessionResult.success) {
        const errorMsg = sessionResult?.error || 'Error desconocido al asegurar sesión de pago';
        console.error('[CheckoutSuccess] ❌ Error al asegurar sesión de pago:', errorMsg);
        throw new Error(`Error al asegurar sesión de pago: ${errorMsg}`);
      }

      console.log('[CheckoutSuccess] ✅ Sesión de pago verificada/creada:', sessionResult.paymentSessionId);
      console.log('[CheckoutSuccess] ========== FIN PASO 1 ==========');

      // Paso 2: Actualizar la sesión de pago con el payment_id de MercadoPago
      if (payment_id) {
        console.log('[CheckoutSuccess] ========== PASO 2: ACTUALIZAR SESIÓN DE PAGO ==========');
        console.log('[CheckoutSuccess] Payment ID recibido de MercadoPago:', payment_id);
        console.log('[CheckoutSuccess] Actualizando sesión de pago con payment_id...');
        console.log('[CheckoutSuccess] Datos a enviar al endpoint:');
        console.log('[CheckoutSuccess]   - paymentSessionId:', sessionResult.paymentSessionId);
        console.log('[CheckoutSuccess]   - paymentId:', payment_id);
        console.log('[CheckoutSuccess]   - cartId:', external_reference);
        
        try {
          const medusaBackendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
          if (!medusaBackendUrl) {
            throw new Error('NEXT_PUBLIC_MEDUSA_BACKEND_URL no está configurado');
          }
          console.log('[CheckoutSuccess] URL del backend:', medusaBackendUrl);
          console.log('[CheckoutSuccess] URL completa del endpoint:', `${medusaBackendUrl}/store/mercadopago/payment/session`);

          const requestBody = {
            paymentSessionId: sessionResult.paymentSessionId,
            paymentId: payment_id,
            cartId: external_reference,
          };
          console.log('[CheckoutSuccess] Body de la request:', JSON.stringify(requestBody, null, 2));
          console.log('[CheckoutSuccess] Realizando fetch al endpoint...');

          // Obtener el publishable API key para el header requerido por Medusa
          const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
          if (!publishableKey) {
            console.error('[CheckoutSuccess] ❌ NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY no está configurado');
            throw new Error('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY no está configurado');
          }

          console.log('[CheckoutSuccess] Publishable API Key encontrado:', publishableKey.substring(0, 10) + '...');

          const updateResponse = await fetch(`${medusaBackendUrl}/store/mercadopago/payment/session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': publishableKey,
            },
            body: JSON.stringify(requestBody),
          });

          console.log('[CheckoutSuccess] ✅ Fetch completado');
          console.log('[CheckoutSuccess] Status de la respuesta:', updateResponse.status);
          console.log('[CheckoutSuccess] StatusText de la respuesta:', updateResponse.statusText);
          console.log('[CheckoutSuccess] Headers de la respuesta:', Object.fromEntries(updateResponse.headers.entries()));

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json().catch(() => ({}));
            console.error('[CheckoutSuccess] ❌ Error al actualizar sesión de pago:');
            console.error('[CheckoutSuccess]   - status:', updateResponse.status);
            console.error('[CheckoutSuccess]   - statusText:', updateResponse.statusText);
            console.error('[CheckoutSuccess]   - error:', JSON.stringify(errorData, null, 2));
            // Continuar de todas formas, el plugin puede usar el external_reference
          } else {
            const updateData = await updateResponse.json();
            console.log('[CheckoutSuccess] ✅ Respuesta exitosa del endpoint:');
            console.log('[CheckoutSuccess]', JSON.stringify(updateData, null, 2));
            console.log('[CheckoutSuccess] ✅ Sesión de pago actualizada');
            
            // Verificar el estado de la sesión después de la actualización
            if (updateData.payment_session) {
              console.log('[CheckoutSuccess] Estado de la sesión después de actualizar:');
              console.log('[CheckoutSuccess]   - id:', updateData.payment_session.id);
              console.log('[CheckoutSuccess]   - status:', updateData.payment_session.status);
            }
          }
        } catch (updateError: any) {
          console.error('[CheckoutSuccess] ❌ Error al llamar endpoint de actualización de sesión:');
          console.error('[CheckoutSuccess] Tipo de error:', updateError?.constructor?.name);
          console.error('[CheckoutSuccess] Mensaje:', updateError?.message);
          console.error('[CheckoutSuccess] Stack:', updateError?.stack);
          console.error('[CheckoutSuccess] Error completo:', JSON.stringify(updateError, Object.getOwnPropertyNames(updateError), 2));
          // Continuar de todas formas, el plugin puede usar el external_reference
        }
        console.log('[CheckoutSuccess] ========== FIN PASO 2 ==========');
        console.log('[CheckoutSuccess] ℹ️ Esperando 2 segundos para que el estado de la sesión se propague...');
        
        // CRÍTICO: Agregar un delay para asegurar que el estado de la sesión se propague completamente
        // en la base de datos antes de intentar completar el carrito
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('[CheckoutSuccess] ✅ Delay completado. Continuando con la recuperación del carrito...');
      } else {
        console.log('[CheckoutSuccess] ⚠️ No hay payment_id, saltando actualización de sesión');
      }
      
      // Paso 3: Recuperar el carrito FINAL con todos los datos actualizados después de actualizar la sesión
      console.log('[CheckoutSuccess] ========== PASO 3: RECUPERAR CARRITO ACTUALIZADO ==========');
      console.log('[CheckoutSuccess] Obteniendo carrito con sesión de pago actualizada...');
      
      // CRÍTICO: Especificar explícitamente los campos del payment_collection para asegurar
      // que Medusa devuelva la información más reciente de las sesiones de pago
      const fieldsString = [
        'id',
        'email',
        'currency_code',
        'total',
        'subtotal',
        'tax_total',
        'discount_total',
        'shipping_total',
        'items.*',
        'shipping_address.*',
        'billing_address.*',
        'shipping_methods.*',
        'payment_collection.id',
        'payment_collection.status',
        'payment_collection.amount',
        'payment_collection.authorized_amount',
        'payment_collection.captured_amount',
        'payment_collection.payment_sessions.*',
      ].join(',');
      
      const finalCartResponse = await medusa.store.cart.retrieve(external_reference, {
        fields: fieldsString,
      });

      if (!finalCartResponse.cart) {
        throw new Error('Carrito no encontrado después de actualizar sesión');
      }

      const finalCart = finalCartResponse.cart;

      // Validar que el carrito tenga todos los datos necesarios
      if (!finalCart.email) {
        throw new Error('El carrito no tiene email');
      }

      if (!finalCart.shipping_address) {
        throw new Error('El carrito no tiene dirección de envío');
      }

      if (!finalCart.billing_address) {
        throw new Error('El carrito no tiene dirección de facturación');
      }

      if (!finalCart.shipping_methods || finalCart.shipping_methods.length === 0) {
        throw new Error('El carrito no tiene método de envío seleccionado');
      }

      // Verificar que la sesión de pago esté presente y autorizada
      const finalPaymentSession = finalCart.payment_collection?.payment_sessions?.find(
        (session) => session.provider_id?.startsWith('pp_mercadopago_')
      );

      if (!finalPaymentSession) {
        throw new Error('No se encontró sesión de pago de MercadoPago');
      }

      console.log('[CheckoutSuccess] Sesión de pago FINAL encontrada:', {
        id: finalPaymentSession.id,
        provider_id: finalPaymentSession.provider_id,
        status: finalPaymentSession.status,
      });

      // VERIFICACIÓN CRÍTICA: El estado debe ser 'authorized' o 'captured'
      // NOTA: Si la sesión no está autorizada, aún intentamos cart.complete() porque
      // el plugin de MercadoPago puede autorizar automáticamente durante cart.complete()
      // usando el external_reference (cart_id) del carrito para buscar el pago
      if (finalPaymentSession.status !== 'authorized' && finalPaymentSession.status !== 'captured') {
        console.warn('[CheckoutSuccess] ⚠️ ADVERTENCIA: La sesión NO está autorizada después de actualizar');
        console.warn('[CheckoutSuccess] Estado esperado: "authorized" o "captured"');
        console.warn('[CheckoutSuccess] Estado actual:', finalPaymentSession.status);
        console.warn('[CheckoutSuccess] Intentando cart.complete() de todas formas - el plugin puede autorizar automáticamente');
        console.warn('[CheckoutSuccess] El plugin buscará el pago usando external_reference:', external_reference);
      } else {
        console.log('[CheckoutSuccess] ✅✅✅ Estado correcto: La sesión está', finalPaymentSession.status);
        console.log('[CheckoutSuccess] cart.complete() debería funcionar correctamente');
      }

      // Verificar también el payment_collection
      const paymentCollection = finalCart.payment_collection;
      if (paymentCollection) {
        console.log('[CheckoutSuccess] Payment Collection:');
        console.log('[CheckoutSuccess]   - id:', paymentCollection.id);
        console.log('[CheckoutSuccess]   - status:', paymentCollection.status);
        console.log('[CheckoutSuccess]   - amount:', paymentCollection.amount);
        console.log('[CheckoutSuccess]   - authorized_amount:', paymentCollection.authorized_amount);
        console.log('[CheckoutSuccess]   - captured_amount:', paymentCollection.captured_amount);
        console.log('[CheckoutSuccess]   - payment_sessions count:', paymentCollection.payment_sessions?.length || 0);
        console.log('[CheckoutSuccess]   - payment_sessions:', JSON.stringify(
          paymentCollection.payment_sessions?.map(s => ({
            id: s.id,
            provider_id: s.provider_id,
            status: s.status,
            amount: s.amount,
          })),
          null,
          2
        ));
      } else {
        console.error('[CheckoutSuccess] ❌❌❌ PROBLEMA CRÍTICO: No hay payment_collection en el carrito');
      }

      console.log('[CheckoutSuccess] Datos del carrito antes de completar:');
      console.log('[CheckoutSuccess]   - cartId:', finalCart.id);
      console.log('[CheckoutSuccess]   - email:', finalCart.email);
      console.log('[CheckoutSuccess]   - hasShippingAddress:', !!finalCart.shipping_address);
      console.log('[CheckoutSuccess]   - hasBillingAddress:', !!finalCart.billing_address);
      console.log('[CheckoutSuccess]   - shippingMethodsCount:', finalCart.shipping_methods?.length || 0);
      console.log('[CheckoutSuccess]   - paymentSessionId:', finalPaymentSession.id);
      console.log('[CheckoutSuccess]   - paymentSessionProviderId:', finalPaymentSession.provider_id);
      console.log('[CheckoutSuccess]   - paymentSessionStatus:', finalPaymentSession.status);
      
      // Establecer el mensaje de envío basado en el método de envío
      const shippingMethod = finalCart.shipping_methods?.[0];
      // Acceder al código del tipo de método de envío de manera segura
      const shippingTypeCode = (shippingMethod as any)?.shipping_option?.type?.code;
      
      if (shippingTypeCode === BAHIA_BLANCA_SHIPPING_CODES.retiroLocal) {
        shippingMessage = 'Tu pedido ya puede ser retirado en el local.';
      } else if (shippingTypeCode === BAHIA_BLANCA_SHIPPING_CODES.bahiaBlanca) {
        shippingMessage = 'Tu pedido está siendo enviado.';
      }
      
      console.log('[CheckoutSuccess] ========== FIN PASO 3 ==========');

      console.log('[CheckoutSuccess] ========== PASO 4: COMPLETAR CARRITO ==========');
      console.log('[CheckoutSuccess] Completando carrito...');
      console.log('[CheckoutSuccess] Llamando a medusa.store.cart.complete...');
      console.log('[CheckoutSuccess] cartId a completar:', external_reference);
      console.log('[CheckoutSuccess] NOTA: Si la sesión no está "authorized" o "captured", el plugin intentará autorizar automáticamente');
      
      // VERIFICACIÓN FINAL ANTES DE COMPLETAR: Loggear TODO el estado del payment_collection
      console.log('[CheckoutSuccess] ========== VERIFICACIÓN FINAL ANTES DE cart.complete() ==========');
      console.log('[CheckoutSuccess] Payment Collection completo:', JSON.stringify({
        id: paymentCollection?.id,
        status: paymentCollection?.status,
        amount: paymentCollection?.amount,
        authorized_amount: paymentCollection?.authorized_amount,
        captured_amount: paymentCollection?.captured_amount,
        payment_sessions: paymentCollection?.payment_sessions?.map(s => ({
          id: s.id,
          provider_id: s.provider_id,
          status: s.status,
          amount: s.amount,
          authorized_at: s.authorized_at,
        })),
      }, null, 2));
      
      // CRÍTICO: Verificar el status del payment_collection
      console.log('[CheckoutSuccess] ⚠️⚠️⚠️ VERIFICACIÓN CRÍTICA DEL PAYMENT_COLLECTION.STATUS ⚠️⚠️⚠️');
      console.log('[CheckoutSuccess] payment_collection.status:', paymentCollection?.status);
      console.log('[CheckoutSuccess] Medusa puede requerir que payment_collection.status sea "authorized" o "awaiting"');
      if (paymentCollection?.status && paymentCollection.status !== 'authorized' && paymentCollection.status !== 'awaiting') {
        console.error('[CheckoutSuccess] ❌❌❌ PROBLEMA: payment_collection.status no es "authorized" ni "awaiting"');
        console.error('[CheckoutSuccess] Status actual:', paymentCollection.status);
        console.error('[CheckoutSuccess] Esto podría causar que cart.complete() falle');
      } else {
        console.log('[CheckoutSuccess] ✅ payment_collection.status es válido:', paymentCollection?.status);
      }
      
      // CRÍTICO: Verificar que el payment_collection tenga authorized_amount > 0
      // Medusa requiere que el payment_collection tenga authorized_amount > 0 para completar el carrito
      if (paymentCollection && (!paymentCollection.authorized_amount || paymentCollection.authorized_amount === 0)) {
        console.error('[CheckoutSuccess] ❌❌❌ PROBLEMA CRÍTICO: payment_collection.authorized_amount es 0 o no existe');
        console.error('[CheckoutSuccess]   - authorized_amount:', paymentCollection.authorized_amount);
        console.error('[CheckoutSuccess]   - amount:', paymentCollection.amount);
        console.error('[CheckoutSuccess]   - status:', paymentCollection.status);
        console.error('[CheckoutSuccess] Esto causará que cart.complete() falle con "Payment sessions are required to complete cart"');
        console.error('[CheckoutSuccess] El problema es que authorizePaymentSession no actualiza el payment_collection.authorized_amount');
        console.error('[CheckoutSuccess] Necesitamos actualizar el payment_collection manualmente o usar el plugin correctamente');
      } else if (paymentCollection && paymentCollection.authorized_amount !== undefined && paymentCollection.authorized_amount > 0) {
        console.log('[CheckoutSuccess] ✅ payment_collection.authorized_amount es > 0:', paymentCollection.authorized_amount);
      }
      
      // Verificar si hay sesiones autorizadas (solo para logging, NO lanzar error)
      const authorizedSessions = paymentCollection?.payment_sessions?.filter(
        s => s.status === 'authorized' || s.status === 'captured'
      ) || [];
      
      console.log('[CheckoutSuccess] Sesiones autorizadas encontradas:', authorizedSessions.length);
      if (authorizedSessions.length === 0) {
        console.warn('[CheckoutSuccess] ⚠️ ADVERTENCIA: No hay sesiones autorizadas en el payment_collection');
        console.warn('[CheckoutSuccess] Estado actual de las sesiones:', paymentCollection?.payment_sessions?.map(s => `${s.id}:${s.status}`).join(', '));
        console.warn('[CheckoutSuccess] Esperando 3 segundos adicionales y reintentando recuperar el carrito...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Reintentar recuperar el carrito después del delay
        console.log('[CheckoutSuccess] Reintentando recuperar el carrito después del delay...');
        const retryCartResponse = await medusa.store.cart.retrieve(external_reference, {
          fields: fieldsString,
        });
        
        if (retryCartResponse.cart?.payment_collection?.payment_sessions) {
          const retryAuthorizedSessions = retryCartResponse.cart.payment_collection.payment_sessions.filter(
            s => s.status === 'authorized' || s.status === 'captured'
          );
          console.log('[CheckoutSuccess] Sesiones autorizadas después del retry:', retryAuthorizedSessions.length);
          if (retryAuthorizedSessions.length > 0) {
            console.log('[CheckoutSuccess] ✅ Sesión autorizada encontrada después del retry. Continuando...');
          }
        }
        
        console.warn('[CheckoutSuccess] Intentando cart.complete() de todas formas - el plugin de MercadoPago puede autorizar automáticamente');
        console.warn('[CheckoutSuccess] El plugin buscará el pago en MercadoPago usando external_reference (cart_id):', external_reference);
      } else {
        console.log('[CheckoutSuccess] ✅ Sesiones autorizadas:', authorizedSessions.map(s => `${s.id}:${s.status}`).join(', '));
      }
      console.log('[CheckoutSuccess] ========== FIN VERIFICACIÓN FINAL ==========');
      
      let cartResponse;
      const maxRetries = 3;
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          const startTime = Date.now();
          console.log(`[CheckoutSuccess] Ejecutando medusa.store.cart.complete() (intento ${retryCount + 1}/${maxRetries})...`);
          console.log('[CheckoutSuccess] ⏳ Esperando que Medusa cree la orden en el backend...');
          cartResponse = await medusa.store.cart.complete(external_reference);
          const endTime = Date.now();
          console.log('[CheckoutSuccess] ✅✅✅ cart.complete ejecutado SIN errores');
          console.log('[CheckoutSuccess] Tiempo de ejecución:', endTime - startTime, 'ms');
          console.log('[CheckoutSuccess] Tipo de respuesta:', cartResponse?.type);
          
          // Verificar inmediatamente si se creó la orden
          if (cartResponse?.type === 'order') {
            console.log('[CheckoutSuccess] ✅✅✅ ORDEN CREADA INMEDIATAMENTE');
            console.log('[CheckoutSuccess] ✅ La orden se guardó en el backend durante cart.complete()');
            console.log('[CheckoutSuccess] ✅ Order ID:', cartResponse.order?.id);
            console.log('[CheckoutSuccess] ✅ Order Display ID:', cartResponse.order?.display_id);
          } else {
            console.log('[CheckoutSuccess] ⚠️ Respuesta no es de tipo "order", es:', cartResponse?.type);
          }
          
          break; // Éxito, salir del loop
        } catch (completeError: any) {
        console.error('[CheckoutSuccess] ❌❌❌ cart.complete() FALLÓ');
        console.error('[CheckoutSuccess] ========== DETALLES DEL ERROR ==========');
        console.error('[CheckoutSuccess] Mensaje del error:', completeError?.message);
        console.error('[CheckoutSuccess] Tipo de error:', completeError?.constructor?.name);
        
          // Si el error es "Payment sessions are required to complete cart"
          if (completeError?.message?.includes('Payment sessions are required')) {
            console.error(`[CheckoutSuccess] ⚠️⚠️⚠️ ERROR: La sesión de pago no está autorizada (intento ${retryCount + 1}/${maxRetries})`);
            console.error('[CheckoutSuccess] Esto significa que authorizePaymentSession NO cambió el estado correctamente');
            console.error('[CheckoutSuccess] La sesión debe estar en estado "authorized" o "captured"');
            
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`[CheckoutSuccess] Reintentando en 2 segundos... (intento ${retryCount + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Recuperar el carrito nuevamente para verificar el estado actualizado
              console.log('[CheckoutSuccess] Recuperando carrito nuevamente para verificar estado...');
              const retryFinalCartResponse = await medusa.store.cart.retrieve(external_reference, {
                fields: fieldsString,
              });
              
              if (retryFinalCartResponse.cart?.payment_collection?.payment_sessions) {
                const retrySessions = retryFinalCartResponse.cart.payment_collection.payment_sessions;
                console.log('[CheckoutSuccess] Estado de las sesiones después del retry:', retrySessions.map(s => `${s.id}:${s.status}`).join(', '));
              }
              
              continue; // Reintentar
            } else {
              console.error('[CheckoutSuccess] ❌ Se agotaron todos los intentos. El carrito no se pudo completar.');
            }
          }
          
          console.error('[CheckoutSuccess] Status HTTP:', completeError?.response?.status);
          console.error('[CheckoutSuccess] StatusText:', completeError?.response?.statusText);
          console.error('[CheckoutSuccess] Data del error:', JSON.stringify(completeError?.response?.data, null, 2));
          console.error('[CheckoutSuccess] Error completo:', JSON.stringify(completeError, Object.getOwnPropertyNames(completeError), 2));
          console.error('[CheckoutSuccess] ========== FIN DETALLES DEL ERROR ==========');
          
          // Si hay un error, intentar obtener más información
          if (completeError?.response?.data) {
            console.error('[CheckoutSuccess] Datos del error de Medusa:', JSON.stringify(completeError.response.data, null, 2));
          }
          
          // Si no es un error de "Payment sessions required" o ya intentamos todas las veces, lanzar el error
          if (!completeError?.message?.includes('Payment sessions are required') || retryCount >= maxRetries) {
            throw completeError;
          }
        }
      }
      
      // Verificar que cartResponse fue asignado (si no, todos los reintentos fallaron)
      if (!cartResponse) {
        const errorMessage = 'El carrito no se pudo completar después de varios intentos. El pago fue procesado en MercadoPago, pero la orden no se creó en Medusa.';
        console.error('[CheckoutSuccess] ❌❌❌ ERROR CRÍTICO:', errorMessage);
        console.error('[CheckoutSuccess] Payment ID de MercadoPago:', payment_id);
        console.error('[CheckoutSuccess] External Reference (cart_id):', external_reference);
        throw new Error(errorMessage + ' Por favor, contactá con soporte e incluye el ID de pago: ' + (payment_id || 'N/A'));
      }
      
      // Type guard para verificar el tipo de respuesta
      const isOrderResponse = (response: typeof cartResponse): response is { type: 'order'; order: any } => {
        return response?.type === 'order' && 'order' in response;
      };
      
      const isCartResponse = (response: typeof cartResponse): response is { type: 'cart'; cart: any; error: any } => {
        return response?.type === 'cart' && 'cart' in response;
      };
      
      console.log('[CheckoutSuccess] Respuesta de cart.complete:', {
        type: cartResponse?.type,
        hasOrder: isOrderResponse(cartResponse),
        hasCart: isCartResponse(cartResponse),
        orderId: isOrderResponse(cartResponse) ? cartResponse.order?.id : undefined,
        orderDisplayId: isOrderResponse(cartResponse) ? cartResponse.order?.display_id : undefined,
        cartId: isCartResponse(cartResponse) ? cartResponse.cart?.id : undefined,
      });
      
      // Log completo de la respuesta para debugging
      console.log('[CheckoutSuccess] Respuesta completa (JSON):', JSON.stringify(cartResponse, null, 2));
      
      console.log('[CheckoutSuccess] ========== ANALIZANDO RESPUESTA ==========');
      console.log('[CheckoutSuccess] Tipo de respuesta:', cartResponse?.type);
      console.log('[CheckoutSuccess] Tiene order:', isOrderResponse(cartResponse));
      console.log('[CheckoutSuccess] Tiene cart:', isCartResponse(cartResponse));
      
      if (isOrderResponse(cartResponse)) {
        console.log('[CheckoutSuccess] ========== ✅✅✅ ORDEN CREADA Y GUARDADA EN EL BACKEND ✅✅✅ ==========');
        console.log('[CheckoutSuccess] 🎉🎉🎉 LA ORDEN SE HA GUARDADO CORRECTAMENTE EN MEDUSA 🎉🎉🎉');
        console.log('[CheckoutSuccess] Detalles completos de la orden guardada:');
        console.log('[CheckoutSuccess]   - id (UUID):', cartResponse.order.id);
        console.log('[CheckoutSuccess]   - display_id (número de orden):', cartResponse.order.display_id);
        console.log('[CheckoutSuccess]   - email:', cartResponse.order.email);
        console.log('[CheckoutSuccess]   - status:', cartResponse.order.status);
        console.log('[CheckoutSuccess]   - total:', cartResponse.order.total);
        console.log('[CheckoutSuccess]   - currency_code:', cartResponse.order.currency_code);
        console.log('[CheckoutSuccess]   - created_at:', cartResponse.order.created_at);
        console.log('[CheckoutSuccess]   - items_count:', cartResponse.order.items?.length || 0);
        console.log('[CheckoutSuccess]   - shipping_address:', cartResponse.order.shipping_address ? 'presente' : 'ausente');
        console.log('[CheckoutSuccess]   - billing_address:', cartResponse.order.billing_address ? 'presente' : 'ausente');
        console.log('[CheckoutSuccess]   - payment_status:', cartResponse.order.payment_status);
        console.log('[CheckoutSuccess]   - fulfillment_status:', cartResponse.order.fulfillment_status);
        console.log('[CheckoutSuccess] ✅ La orden está guardada en la base de datos de Medusa');
        console.log('[CheckoutSuccess] ✅ La orden aparecerá en el panel de administración');
        console.log('[CheckoutSuccess] ✅ El evento "order.placed" se ha disparado');
        console.log('[CheckoutSuccess] ✅ El email de confirmación se enviará automáticamente');
        console.log('[CheckoutSuccess] Payment ID de MercadoPago:', payment_id);
        console.log('[CheckoutSuccess] External Reference (cart_id original):', external_reference);
        
        // Log completo de la orden en formato JSON para debugging
        console.log('[CheckoutSuccess] Orden completa (JSON):', JSON.stringify({
          id: cartResponse.order.id,
          display_id: cartResponse.order.display_id,
          email: cartResponse.order.email,
          status: cartResponse.order.status,
          total: cartResponse.order.total,
          currency_code: cartResponse.order.currency_code,
          items_count: cartResponse.order.items?.length || 0,
          payment_status: cartResponse.order.payment_status,
          fulfillment_status: cartResponse.order.fulfillment_status,
        }, null, 2));
        
        // Limpiar el carrito
        console.log('[CheckoutSuccess] Limpiando cookie del carrito...');
        await cookies.removeCartId();
        console.log('[CheckoutSuccess] ✅ Cookie del carrito eliminada');
        
        // Redirigir a la página de confirmación de orden
        const redirectUrl = `/${params.locale}/${params.countryCode}/order/${cartResponse.order.display_id}/confirmed`;
        console.log('[CheckoutSuccess] Redirigiendo a la página de confirmación:', redirectUrl);
        console.log('[CheckoutSuccess] ========== FIN DEL PROCESO DE CHECKOUT (ÉXITO) ==========');
        redirect(redirectUrl);
      } else if (isCartResponse(cartResponse)) {
        console.error('[CheckoutSuccess] ========== ❌ ERROR: CARRITO NO COMPLETADO ==========');
        console.error('[CheckoutSuccess] cart.complete retornó un carrito en lugar de una orden');
        console.error('[CheckoutSuccess] Esto significa que el carrito no se pudo completar');
        console.error('[CheckoutSuccess] Tipo de respuesta:', cartResponse.type);
        console.error('[CheckoutSuccess] Estado del carrito retornado:', {
          id: cartResponse.cart?.id,
          email: cartResponse.cart?.email,
          hasPaymentCollection: !!cartResponse.cart?.payment_collection,
          paymentSessionsCount: cartResponse.cart?.payment_collection?.payment_sessions?.length || 0,
          paymentSessions: cartResponse.cart?.payment_collection?.payment_sessions?.map((s: any) => ({
            id: s.id,
            provider_id: s.provider_id,
            status: s.status,
          })),
        });
        console.error('[CheckoutSuccess] Payment ID de MercadoPago:', payment_id);
        console.error('[CheckoutSuccess] External Reference (cart_id):', external_reference);
        
        throw new Error(
          'El carrito no se pudo completar. El pago fue procesado en MercadoPago, pero la orden no se creó en Medusa. ' +
          'Por favor, contactá con soporte e incluye el ID de pago: ' + (payment_id || 'N/A')
        );
      } else {
        console.error('[CheckoutSuccess] ========== ❌ ERROR: RESPUESTA INESPERADA ==========');
        console.error('[CheckoutSuccess] Respuesta completa recibida:', JSON.stringify(cartResponse, null, 2));
        throw new Error('Respuesta inesperada al completar el carrito. Por favor, contactá con soporte.');
      }
    } catch (error: any) {
      console.error('[CheckoutSuccess] ❌❌❌ ERROR CRÍTICO AL COMPLETAR EL CARRITO ❌❌❌');
      console.error('[CheckoutSuccess] ========== DETALLES DEL ERROR ==========');
      console.error('[CheckoutSuccess] Tipo de error:', error?.constructor?.name);
      console.error('[CheckoutSuccess] Mensaje:', error?.message);
      console.error('[CheckoutSuccess] Stack:', error?.stack);
      console.error('[CheckoutSuccess] Payment ID de MercadoPago:', payment_id);
      console.error('[CheckoutSuccess] External Reference (cart_id):', external_reference);
      
      // Loggear detalles adicionales si están disponibles
      if (error?.response) {
        console.error('[CheckoutSuccess] Error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }
      
      // Loggear el error completo serializado
      try {
        console.error('[CheckoutSuccess] Error completo (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      } catch (jsonError) {
        console.error('[CheckoutSuccess] No se pudo serializar el error:', jsonError);
      }
      
      console.error('[CheckoutSuccess] ========== FIN DETALLES DEL ERROR ==========');
      
      // CRÍTICO: NO mostrar la página de éxito si no se creó la orden
      // El pago fue procesado en MercadoPago, pero la orden NO se creó en Medusa
      // Esto es un error crítico que debe ser resuelto
      // 
      // IMPORTANTE: En producción, Next.js oculta los detalles del error en Server Components.
      // Por lo tanto, necesitamos asegurarnos de que el error se propague correctamente
      // para que el usuario vea un mensaje de error apropiado.
      const errorMessage = error?.message || 'Error desconocido al crear la orden';
      const fullErrorMessage = `Error al crear la orden. El pago fue procesado en MercadoPago, pero la orden no se pudo crear en el sistema. Por favor, contactá con soporte e incluye el ID de pago: ${payment_id || 'N/A'} y el mensaje de error: ${errorMessage}`;
      
      console.error('[CheckoutSuccess] Lanzando error con mensaje:', fullErrorMessage);
      throw new Error(fullErrorMessage);
    }
  } else {
    // Si no se cumplen las condiciones, mostrar mensaje apropiado
    console.log('[CheckoutSuccess] ⚠️ Condiciones NO cumplidas para completar carrito');
    console.log('[CheckoutSuccess]   - external_reference:', external_reference || 'NO HAY');
    console.log('[CheckoutSuccess]   - collection_status:', collection_status || 'NO HAY');
    console.log('[CheckoutSuccess]   - status:', status || 'NO HAY');
    console.log('[CheckoutSuccess] Mostrando página de éxito sin completar carrito');
    
    // Si hay un payment_id pero el status no es approved, mostrar mensaje de pago pendiente
    if (payment_id && (collection_status !== 'approved' || status !== 'approved')) {
      shippingMessage = 'Tu pago está siendo procesado. Te notificaremos cuando esté confirmado.';
    }
  }

  return (
    <div className='bg-secondary flex flex-col items-center justify-center border-b py-20 text-center'>
      <div className='text-background rounded-full bg-green-600 p-4'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <polyline points='20 6 9 17 4 12' />
        </svg>
      </div>
      <h4 className='mt-4 text-xl font-semibold text-green-500'>
        ¡Pago exitoso!
      </h4>
      <p className='mt-2'>
        Tu pago ha sido procesado correctamente.
      </p>
      {payment_id && (
        <p className='mt-1 text-sm opacity-75'>
          ID de pago: {payment_id}
        </p>
      )}
      <p className='mt-4 text-sm'>
        {shippingMessage}
      </p>
    </div>
  );
}

