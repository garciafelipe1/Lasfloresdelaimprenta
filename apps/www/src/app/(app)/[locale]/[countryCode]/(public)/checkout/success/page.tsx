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

  // Si tenemos un external_reference (cart_id), intentar completar el carrito
  if (external_reference && collection_status === 'approved' && status === 'approved') {
    try {
      console.log('[CheckoutSuccess] Intentando completar carrito:', external_reference);
      
      // Paso 1: Asegurar que existe una sesión de pago de MercadoPago
      console.log('[CheckoutSuccess] Asegurando sesión de pago de MercadoPago...');
      const sessionResult = await ensureMercadoPagoPaymentSession(external_reference);
      
      if (!sessionResult.success) {
        console.error('[CheckoutSuccess] Error al asegurar sesión de pago:', sessionResult.error);
        // Continuar intentando completar el carrito de todas formas
      }
      
      // Paso 2: Actualizar la sesión de pago con el payment_id si está disponible
      if (payment_id && sessionResult.paymentSessionId) {
        console.log('[CheckoutSuccess] Actualizando sesión con payment_id:', payment_id);
        try {
          const backendUrl = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
          if (backendUrl) {
            await fetch(`${backendUrl}/store/mercadopago/payment/session`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentSessionId: sessionResult.paymentSessionId,
                paymentId: payment_id,
                cartId: external_reference,
              }),
            });
          }
        } catch (updateError: any) {
          console.error('[CheckoutSuccess] Error al actualizar sesión con payment_id:', updateError);
          // Continuar de todas formas
        }
      }
      
      // Paso 3: Completar el carrito para crear la orden
      console.log('[CheckoutSuccess] Completando carrito...');
      const cartResponse = await medusa.store.cart.complete(external_reference);
      
      if (cartResponse.type === 'order') {
        console.log('[CheckoutSuccess] Orden creada exitosamente:', cartResponse.order.id);
        
        // Limpiar el carrito
        await cookies.removeCartId();
        
        // Redirigir a la página de confirmación de orden
        redirect(`/${params.locale}/${params.countryCode}/order/${cartResponse.order.display_id}/confirmed`);
      } else {
        console.warn('[CheckoutSuccess] El carrito no se pudo completar:', cartResponse);
      }
    } catch (error: any) {
      console.error('[CheckoutSuccess] Error al completar el carrito:', error);
      console.error('[CheckoutSuccess] Error completo:', JSON.stringify(error, null, 2));
      // Continuar mostrando la página de éxito aunque haya un error
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

