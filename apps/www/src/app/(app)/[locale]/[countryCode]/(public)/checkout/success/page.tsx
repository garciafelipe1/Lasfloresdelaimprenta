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
  
  if (external_reference) {
    try {
      const cartResponse = await medusa.store.cart.retrieve(external_reference, {
        fields: 'shipping_methods.*,shipping_methods.type.*',
      });
      
      const shippingMethod = cartResponse.cart?.shipping_methods?.[0];
      const shippingTypeCode = shippingMethod?.type?.code;
      
      if (shippingTypeCode === BAHIA_BLANCA_SHIPPING_CODES.retiroLocal) {
        shippingMessage = 'Tu pedido ya puede ser retirado en el local.';
      } else if (shippingTypeCode === BAHIA_BLANCA_SHIPPING_CODES.bahiaBlanca) {
        shippingMessage = 'Tu pedido está siendo enviado.';
      }
    } catch (error) {
      console.error('[CheckoutSuccess] Error al obtener información del carrito:', error);
      // Continuar con el mensaje por defecto
    }
  }

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
      
      // Paso 2: Verificar que el carrito está listo para completar
      const cartCheck = await medusa.store.cart.retrieve(external_reference, {
        fields: 'id,email,shipping_address.*,billing_address.*,shipping_methods.*,payment_collection.payment_sessions.*',
      });

      if (!cartCheck.cart) {
        throw new Error('Carrito no encontrado');
      }

      const cart = cartCheck.cart;

      // Validar que el carrito tenga todos los datos necesarios
      if (!cart.email) {
        throw new Error('El carrito no tiene email');
      }

      if (!cart.shipping_address) {
        throw new Error('El carrito no tiene dirección de envío');
      }

      if (!cart.billing_address) {
        throw new Error('El carrito no tiene dirección de facturación');
      }

      if (!cart.shipping_methods || cart.shipping_methods.length === 0) {
        throw new Error('El carrito no tiene método de envío seleccionado');
      }

      // Verificar que la sesión de pago esté presente
      const paymentSession = cart.payment_collection?.payment_sessions?.find(
        (session) => session.provider_id?.startsWith('pp_mercadopago_')
      );

      if (!paymentSession) {
        throw new Error('No se encontró sesión de pago de MercadoPago');
      }

      console.log('[CheckoutSuccess] Sesión de pago encontrada:', {
        id: paymentSession.id,
        provider_id: paymentSession.provider_id,
        status: paymentSession.status,
      });

      // Paso 3: Actualizar la sesión de pago con el payment_id de MercadoPago
      if (payment_id) {
        console.log('[CheckoutSuccess] ========== PASO 3: ACTUALIZAR SESIÓN DE PAGO ==========');
        console.log('[CheckoutSuccess] Payment ID recibido de MercadoPago:', payment_id);
        console.log('[CheckoutSuccess] Actualizando sesión de pago con payment_id...');
        console.log('[CheckoutSuccess] Datos a enviar al endpoint:');
        console.log('[CheckoutSuccess]   - paymentSessionId:', paymentSession.id);
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
            paymentSessionId: paymentSession.id,
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
        console.log('[CheckoutSuccess] ========== FIN PASO 3 ==========');
      } else {
        console.log('[CheckoutSuccess] ⚠️ No hay payment_id, saltando actualización de sesión');
      }
      
      // Paso 4: Completar el carrito para crear la orden
      // El plugin de MercadoPago debería verificar el pago usando el external_reference o el payment_id en la sesión
      console.log('[CheckoutSuccess] ========== PASO 4: COMPLETAR CARRITO ==========');
      console.log('[CheckoutSuccess] Completando carrito...');
      
      // CRÍTICO: Verificar TODAS las sesiones de pago antes de completar
      console.log('[CheckoutSuccess] ========== VERIFICACIÓN CRÍTICA ANTES DE COMPLETAR ==========');
      console.log('[CheckoutSuccess] Obteniendo sesión de pago actualizada antes de completar...');
      try {
        const updatedCartCheck = await medusa.store.cart.retrieve(external_reference, {
          fields: 'payment_collection.payment_sessions.*,payment_collection.*',
        });
        
        console.log('[CheckoutSuccess] Todas las sesiones de pago del carrito:');
        const allSessions = updatedCartCheck.cart?.payment_collection?.payment_sessions || [];
        console.log('[CheckoutSuccess]   - Total de sesiones:', allSessions.length);
        
        allSessions.forEach((session, index) => {
          console.log(`[CheckoutSuccess]   Sesión ${index + 1}:`);
          console.log(`[CheckoutSuccess]     - id: ${session.id}`);
          console.log(`[CheckoutSuccess]     - provider_id: ${session.provider_id}`);
          console.log(`[CheckoutSuccess]     - status: ${session.status} ${session.status === 'authorized' || session.status === 'captured' ? '✅' : '❌'}`);
        });
        
        const updatedPaymentSession = allSessions.find(
          (session) => session.provider_id?.startsWith('pp_mercadopago_')
        );
        
        if (updatedPaymentSession) {
          console.log('[CheckoutSuccess] Sesión de MercadoPago encontrada:');
          console.log('[CheckoutSuccess]   - id:', updatedPaymentSession.id);
          console.log('[CheckoutSuccess]   - provider_id:', updatedPaymentSession.provider_id);
          console.log('[CheckoutSuccess]   - status:', updatedPaymentSession.status);
          
          // VERIFICACIÓN CRÍTICA: El estado debe ser 'authorized' o 'captured'
          if (updatedPaymentSession.status !== 'authorized' && updatedPaymentSession.status !== 'captured') {
            console.error('[CheckoutSuccess] ❌❌❌ PROBLEMA CRÍTICO: La sesión NO está autorizada');
            console.error('[CheckoutSuccess] Estado esperado: "authorized" o "captured"');
            console.error('[CheckoutSuccess] Estado actual:', updatedPaymentSession.status);
            console.error('[CheckoutSuccess] cart.complete() FALLARÁ con "Payment sessions are required to complete cart"');
            console.error('[CheckoutSuccess] Esto significa que la autorización NO funcionó correctamente');
          } else {
            console.log('[CheckoutSuccess] ✅✅✅ Estado correcto: La sesión está', updatedPaymentSession.status);
            console.log('[CheckoutSuccess] cart.complete() debería funcionar correctamente');
          }
        } else {
          console.error('[CheckoutSuccess] ❌ No se encontró sesión de MercadoPago');
        }
        
        // Verificar también el payment_collection
        const paymentCollection = updatedCartCheck.cart?.payment_collection;
        if (paymentCollection) {
          console.log('[CheckoutSuccess] Payment Collection:');
          console.log('[CheckoutSuccess]   - id:', paymentCollection.id);
          console.log('[CheckoutSuccess]   - status:', paymentCollection.status);
          console.log('[CheckoutSuccess]   - amount:', paymentCollection.amount);
        }
      } catch (sessionCheckError: any) {
        console.error('[CheckoutSuccess] ❌ Error al verificar sesión antes de completar:');
        console.error('[CheckoutSuccess] Mensaje:', sessionCheckError.message);
        console.error('[CheckoutSuccess] Stack:', sessionCheckError.stack);
      }
      console.log('[CheckoutSuccess] ========== FIN VERIFICACIÓN CRÍTICA ==========');
      
      console.log('[CheckoutSuccess] Datos del carrito antes de completar:');
      console.log('[CheckoutSuccess]   - cartId:', cart.id);
      console.log('[CheckoutSuccess]   - email:', cart.email);
      console.log('[CheckoutSuccess]   - hasShippingAddress:', !!cart.shipping_address);
      console.log('[CheckoutSuccess]   - hasBillingAddress:', !!cart.billing_address);
      console.log('[CheckoutSuccess]   - shippingMethodsCount:', cart.shipping_methods?.length || 0);
      console.log('[CheckoutSuccess]   - paymentSessionId:', paymentSession.id);
      console.log('[CheckoutSuccess]   - paymentSessionProviderId:', paymentSession.provider_id);
      console.log('[CheckoutSuccess]   - paymentSessionStatus:', paymentSession.status);
      console.log('[CheckoutSuccess] Datos del carrito antes de completar:', {
        cartId: cart.id,
        email: cart.email,
        hasShippingAddress: !!cart.shipping_address,
        hasBillingAddress: !!cart.billing_address,
        shippingMethodsCount: cart.shipping_methods?.length || 0,
        paymentSessionId: paymentSession.id,
        paymentSessionProviderId: paymentSession.provider_id,
        paymentSessionStatus: paymentSession.status,
      });

      console.log('[CheckoutSuccess] ========== LLAMANDO A cart.complete() ==========');
      console.log('[CheckoutSuccess] Llamando a medusa.store.cart.complete...');
      console.log('[CheckoutSuccess] cartId a completar:', external_reference);
      console.log('[CheckoutSuccess] NOTA: Si la sesión no está "authorized" o "captured", esto fallará');
      
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

