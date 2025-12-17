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

      // Paso 3: Registrar el payment_id en los logs (el plugin debería usar el external_reference)
      if (payment_id) {
        console.log('[CheckoutSuccess] Payment ID recibido de MercadoPago:', payment_id);
        console.log('[CheckoutSuccess] Este payment_id debería estar asociado al external_reference (cart_id):', external_reference);
      }
      
      // Paso 4: Completar el carrito para crear la orden
      // El plugin de MercadoPago debería verificar el pago usando el external_reference
      console.log('[CheckoutSuccess] Completando carrito...');
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

      console.log('[CheckoutSuccess] Llamando a medusa.store.cart.complete...');
      let cartResponse;
      
      try {
        cartResponse = await medusa.store.cart.complete(external_reference);
        console.log('[CheckoutSuccess] ✅ cart.complete ejecutado sin lanzar excepción');
      } catch (completeError: any) {
        console.error('[CheckoutSuccess] ❌ Error al llamar cart.complete:', {
          message: completeError?.message,
          status: completeError?.response?.status,
          statusText: completeError?.response?.statusText,
          data: completeError?.response?.data,
          error: completeError,
        });
        
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
      
      if (cartResponse?.type === 'order' && cartResponse?.order) {
        console.log('[CheckoutSuccess] ✅ Orden creada exitosamente:', {
          id: cartResponse.order.id,
          display_id: cartResponse.order.display_id,
        });
        
        // Limpiar el carrito
        await cookies.removeCartId();
        
        // Redirigir a la página de confirmación de orden
        redirect(`/${params.locale}/${params.countryCode}/order/${cartResponse.order.display_id}/confirmed`);
      } else if (cartResponse?.type === 'cart' || cartResponse?.cart) {
        console.error('[CheckoutSuccess] ❌ cart.complete retornó un carrito en lugar de una orden');
        console.error('[CheckoutSuccess] Esto significa que el carrito no se pudo completar');
        console.error('[CheckoutSuccess] Tipo de respuesta:', cartResponse.type);
        console.error('[CheckoutSuccess] Carrito retornado:', {
          id: cartResponse.cart?.id,
          status: cartResponse.cart?.status,
          payment_collection: cartResponse.cart?.payment_collection,
        });
        
        throw new Error(
          'El carrito no se pudo completar. El pago fue procesado en MercadoPago, pero la orden no se creó en Medusa. ' +
          'Por favor, contactá con soporte e incluye el ID de pago: ' + (payment_id || 'N/A')
        );
      } else {
        console.error('[CheckoutSuccess] ❌ Respuesta inesperada de cart.complete');
        console.error('[CheckoutSuccess] Respuesta:', cartResponse);
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

