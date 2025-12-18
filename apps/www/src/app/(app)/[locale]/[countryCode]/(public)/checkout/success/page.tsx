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

  console.log('[CheckoutSuccess] Parámetros recibidos:', searchParams);

  // Obtener información del método de envío antes de completar el carrito
  let shippingMessage = 'Te enviaremos un correo con los detalles de tu pedido. Si tenés alguna duda, no dudes en contactarnos.';
  
  // El mensaje de envío se establecerá después de recuperar el carrito actualizado

  // Si tenemos un external_reference (cart_id) y el pago fue aprobado, intentar completar el carrito
  if (external_reference && collection_status === 'approved' && status === 'approved') {
    try {
      console.log('[CheckoutSuccess] Intentando completar carrito:', external_reference);
      console.log('[CheckoutSuccess] Payment ID recibido:', payment_id);
      
      // Paso 1: Asegurar que existe una sesión de pago de MercadoPago
      console.log('[CheckoutSuccess] Asegurando sesión de pago de MercadoPago...');
      const sessionResult = await ensureMercadoPagoPaymentSession(external_reference);
      
      if (!sessionResult.success) {
        console.error('[CheckoutSuccess] Error al asegurar sesión de pago:', sessionResult.error);
        throw new Error(`Error al asegurar sesión de pago: ${sessionResult.error}`);
      }

      console.log('[CheckoutSuccess] Sesión de pago verificada/creada:', sessionResult.paymentSessionId);

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
        console.log('[CheckoutSuccess] ℹ️ El endpoint solo verifica el pago. El plugin autorizará automáticamente durante cart.complete()');
      } else {
        console.log('[CheckoutSuccess] ⚠️ No hay payment_id, saltando actualización de sesión');
      }
      
      // Paso 3: Recuperar el carrito FINAL con todos los datos actualizados después de actualizar la sesión
      console.log('[CheckoutSuccess] ========== PASO 3: RECUPERAR CARRITO ACTUALIZADO ==========');
      console.log('[CheckoutSuccess] Obteniendo carrito con sesión de pago actualizada...');
      
      // CRÍTICO: NO especificar fields para que Medusa devuelva TODOS los datos del carrito
      // Esto asegura que la validación de cart.complete() tenga acceso a todos los datos necesarios
      const finalCartResponse = await medusa.store.cart.retrieve(external_reference);

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
      const shippingTypeCode = shippingMethod?.type?.code;
      
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
      
      // Verificar si hay sesiones autorizadas (solo para logging, NO lanzar error)
      const authorizedSessions = paymentCollection?.payment_sessions?.filter(
        s => s.status === 'authorized' || s.status === 'captured'
      ) || [];
      
      console.log('[CheckoutSuccess] Sesiones autorizadas encontradas:', authorizedSessions.length);
      if (authorizedSessions.length === 0) {
        console.warn('[CheckoutSuccess] ⚠️ ADVERTENCIA: No hay sesiones autorizadas en el payment_collection');
        console.warn('[CheckoutSuccess] Estado actual de las sesiones:', paymentCollection?.payment_sessions?.map(s => `${s.id}:${s.status}`).join(', '));
        console.warn('[CheckoutSuccess] Intentando cart.complete() de todas formas - el plugin de MercadoPago puede autorizar automáticamente');
        console.warn('[CheckoutSuccess] El plugin buscará el pago en MercadoPago usando external_reference (cart_id):', external_reference);
      } else {
        console.log('[CheckoutSuccess] ✅ Sesiones autorizadas:', authorizedSessions.map(s => `${s.id}:${s.status}`).join(', '));
      }
      console.log('[CheckoutSuccess] ========== FIN VERIFICACIÓN FINAL ==========');
      
      let cartResponse;
      
      try {
        const startTime = Date.now();
        console.log('[CheckoutSuccess] Ejecutando medusa.store.cart.complete()...');
        cartResponse = await medusa.store.cart.complete(external_reference);
        const endTime = Date.now();
        console.log('[CheckoutSuccess] ✅✅✅ cart.complete ejecutado SIN errores');
        console.log('[CheckoutSuccess] Tiempo de ejecución:', endTime - startTime, 'ms');
        console.log('[CheckoutSuccess] Tipo de respuesta:', cartResponse?.type);
      } catch (completeError: any) {
        console.error('[CheckoutSuccess] ❌❌❌ cart.complete() FALLÓ');
        console.error('[CheckoutSuccess] ========== DETALLES DEL ERROR ==========');
        console.error('[CheckoutSuccess] Mensaje del error:', completeError?.message);
        console.error('[CheckoutSuccess] Tipo de error:', completeError?.constructor?.name);
        
        // Si el error es "Payment sessions are required to complete cart"
        if (completeError?.message?.includes('Payment sessions are required')) {
          console.error('[CheckoutSuccess] ⚠️⚠️⚠️ ERROR ESPERADO: La sesión de pago no está autorizada');
          console.error('[CheckoutSuccess] Esto significa que authorizePaymentSession NO cambió el estado correctamente');
          console.error('[CheckoutSuccess] La sesión debe estar en estado "authorized" o "captured"');
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
        
        throw completeError;
      }
      
      console.log('[CheckoutSuccess] Respuesta de cart.complete:', {
        type: cartResponse?.type,
        hasOrder: !!cartResponse?.order,
        hasCart: !!cartResponse?.cart,
        orderId: cartResponse?.order?.id,
        orderDisplayId: cartResponse?.order?.display_id,
        cartId: cartResponse?.cart?.id,
      });
      
      // Log completo de la respuesta para debugging
      console.log('[CheckoutSuccess] Respuesta completa (JSON):', JSON.stringify(cartResponse, null, 2));
      
      console.log('[CheckoutSuccess] ========== ANALIZANDO RESPUESTA ==========');
      console.log('[CheckoutSuccess] Tipo de respuesta:', cartResponse?.type);
      console.log('[CheckoutSuccess] Tiene order:', !!cartResponse?.order);
      console.log('[CheckoutSuccess] Tiene cart:', !!cartResponse?.cart);
      
      if (cartResponse?.type === 'order' && cartResponse?.order) {
        console.log('[CheckoutSuccess] ========== ✅ ORDEN CREADA EXITOSAMENTE ==========');
        console.log('[CheckoutSuccess] Detalles de la orden:', {
          id: cartResponse.order.id,
          display_id: cartResponse.order.display_id,
          email: cartResponse.order.email,
          status: cartResponse.order.status,
          total: cartResponse.order.total,
          currency_code: cartResponse.order.currency_code,
        });
        
        // Limpiar el carrito
        console.log('[CheckoutSuccess] Limpiando cookie del carrito...');
        await cookies.removeCartId();
        
        // Redirigir a la página de confirmación de orden
        const redirectUrl = `/${params.locale}/${params.countryCode}/order/${cartResponse.order.display_id}/confirmed`;
        console.log('[CheckoutSuccess] Redirigiendo a:', redirectUrl);
        redirect(redirectUrl);
      } else if (cartResponse?.type === 'cart' || cartResponse?.cart) {
        console.error('[CheckoutSuccess] ========== ❌ ERROR: CARRITO NO COMPLETADO ==========');
        console.error('[CheckoutSuccess] cart.complete retornó un carrito en lugar de una orden');
        console.error('[CheckoutSuccess] Esto significa que el carrito no se pudo completar');
        console.error('[CheckoutSuccess] Tipo de respuesta:', cartResponse.type);
        console.error('[CheckoutSuccess] Estado del carrito retornado:', {
          id: cartResponse.cart?.id,
          status: cartResponse.cart?.status,
          email: cartResponse.cart?.email,
          hasPaymentCollection: !!cartResponse.cart?.payment_collection,
          paymentSessionsCount: cartResponse.cart?.payment_collection?.payment_sessions?.length || 0,
          paymentSessions: cartResponse.cart?.payment_collection?.payment_sessions?.map(s => ({
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
      console.error('[CheckoutSuccess] ❌ Error al completar el carrito:', error);
      console.error('[CheckoutSuccess] Tipo de error:', error?.constructor?.name);
      console.error('[CheckoutSuccess] Mensaje:', error?.message);
      console.error('[CheckoutSuccess] Stack:', error?.stack);
      
      // Loggear detalles adicionales si están disponibles
      if (error.response) {
        console.error('[CheckoutSuccess] Error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }
      
      // Continuar mostrando la página de éxito aunque haya un error
      // El pago fue procesado en MercadoPago, pero la orden no se creó en Medusa
      // Esto puede ser un problema temporal o de configuración
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

