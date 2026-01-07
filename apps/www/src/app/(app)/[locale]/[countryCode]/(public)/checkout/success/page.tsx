import { redirect } from 'next/navigation';
import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';
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

  console.log('[CheckoutSuccess] ========== PÁGINA DE ÉXITO ==========');
  console.log('[CheckoutSuccess] Parámetros recibidos:', JSON.stringify(searchParams, null, 2));

  // Mensaje de envío por defecto
  let shippingMessage = 'Tu pedido está siendo procesado. Recibirás un correo con los detalles de tu pedido cuando esté listo.';

  // Si tenemos un external_reference (cart_id) y el pago fue aprobado, intentar completar el carrito
  // CRÍTICO: Primero debemos autorizar la sesión de pago antes de intentar completar el carrito
  if (external_reference && collection_status === 'approved' && status === 'approved' && payment_id) {
    console.log('[CheckoutSuccess] ✅ Pago aprobado, autorizando sesión y completando carrito...');
    
    try {
      // Paso 1: Autorizar la sesión de pago llamando al endpoint del backend
      console.log('[CheckoutSuccess] Paso 1: Autorizando sesión de pago...');
      const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';
      const medusaBackendUrl = 
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 
        process.env.NEXT_PUBLIC_BACKEND_URL || 
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:9000';
      
      if (!publishableKey) {
        console.error('[CheckoutSuccess] ❌ NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY no está configurado');
      } else {
        const sessionUpdateUrl = `${medusaBackendUrl}/store/mercadopago/payment/session`;
        console.log('[CheckoutSuccess] URL de actualización de sesión:', sessionUpdateUrl);
        
        const sessionUpdateResponse = await fetch(sessionUpdateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': publishableKey,
          },
          body: JSON.stringify({
            paymentId: payment_id,
            cartId: external_reference,
          }),
        });
        
        if (sessionUpdateResponse.ok) {
          const sessionUpdateData = await sessionUpdateResponse.json();
          console.log('[CheckoutSuccess] ✅ Sesión autorizada:', sessionUpdateData);
        } else {
          const errorText = await sessionUpdateResponse.text().catch(() => '');
          console.warn('[CheckoutSuccess] ⚠️ Error al autorizar sesión:', sessionUpdateResponse.status, errorText);
        }
      }
      
      // Paso 2: Esperar un poco para que la autorización se propague
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Paso 3: Intentar completar el carrito con reintentos
      console.log('[CheckoutSuccess] Paso 2: Intentando completar carrito...');
      const attemptCartCompletion = async (cartId: string, retries = 3): Promise<boolean> => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            console.log(`[CheckoutSuccess] Intento ${attempt}/${retries} de completar carrito...`);
            
            // Esperar un poco entre intentos
            if (attempt > 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Verificar el estado del carrito antes de intentar completarlo
            try {
              const cartData = await medusa.store.cart.retrieve(cartId, {
                fields: 'payment_collection.authorized_amount,payment_collection.amount,payment_collection.payment_sessions.*',
              });
              
              const authorizedAmount = (cartData.cart as any)?.payment_collection?.authorized_amount || 0;
              const cartAmount = (cartData.cart as any)?.payment_collection?.amount || 0;
              const paymentSessions = (cartData.cart as any)?.payment_collection?.payment_sessions || [];
              
              console.log(`[CheckoutSuccess] Estado del carrito (intento ${attempt}):`, {
                authorizedAmount,
                cartAmount,
                paymentSessionsCount: paymentSessions.length,
                paymentSessionsStatus: paymentSessions.map((s: any) => ({ id: s.id, status: s.status, provider_id: s.provider_id })),
                ready: authorizedAmount > 0 && authorizedAmount === cartAmount,
              });
              
              if (authorizedAmount === 0 || authorizedAmount !== cartAmount) {
                console.warn(`[CheckoutSuccess] ⚠️ authorized_amount (${authorizedAmount}) no coincide con amount (${cartAmount}), esperando...`);
                if (attempt < retries) continue;
              }
            } catch (retrieveError) {
              console.warn(`[CheckoutSuccess] ⚠️ Error al verificar carrito:`, retrieveError);
            }
            
            const cartResponse = await medusa.store.cart.complete(cartId);
            
            if (cartResponse?.type === 'order') {
              console.log('[CheckoutSuccess] ✅✅✅ Carrito completado exitosamente desde página de éxito');
              console.log('[CheckoutSuccess] Order ID:', cartResponse.order?.id);
              console.log('[CheckoutSuccess] Order Display ID:', cartResponse.order?.display_id);
              
              // Limpiar cookie y redirigir
              await cookies.removeCartId();
              const redirectUrl = `/${params.locale}/${params.countryCode}/order/${cartResponse.order.display_id}/confirmed`;
              redirect(redirectUrl);
            } else {
              console.log('[CheckoutSuccess] ⚠️ cart.complete retornó tipo:', cartResponse?.type);
              if (attempt < retries) {
                continue;
              }
            }
          } catch (completeError: any) {
            console.warn(`[CheckoutSuccess] ⚠️ Error en intento ${attempt}:`, completeError?.message);
            if (attempt < retries) {
              continue;
            }
          }
        }
        return false;
      };
      
      // Intentar completar el carrito (esto puede redirigir si tiene éxito)
      await attemptCartCompletion(external_reference, 3);
      
      // Si llegamos aquí, no se pudo completar el carrito (el webhook lo hará)
      console.log('[CheckoutSuccess] No se pudo completar el carrito desde la página de éxito.');
      console.log('[CheckoutSuccess] El webhook completará el carrito automáticamente, mostrando página de éxito');
    } catch (error: any) {
      console.error('[CheckoutSuccess] ❌ Error al procesar pago:', error?.message);
      console.error('[CheckoutSuccess] Stack:', error?.stack);
      // Continuar para mostrar la página de éxito de todas formas
    }
  }

  // Intentar obtener información del carrito para el mensaje de envío personalizado
  if (external_reference) {
    try {
      const cartResponse = await medusa.store.cart.retrieve(external_reference, {
        fields: 'shipping_methods.*',
      });

      if (cartResponse.cart?.shipping_methods?.[0]) {
        const shippingMethod = cartResponse.cart.shipping_methods[0];
        const shippingTypeCode = (shippingMethod as any)?.shipping_option?.type?.code;

        if (shippingTypeCode === BAHIA_BLANCA_SHIPPING_CODES.retiroLocal) {
          shippingMessage = 'Tu pedido ya puede ser retirado en el local. Recibirás un correo con los detalles.';
        } else if (shippingTypeCode === BAHIA_BLANCA_SHIPPING_CODES.bahiaBlanca) {
          shippingMessage = 'Tu pedido está siendo enviado. Recibirás un correo con los detalles cuando esté en camino.';
        }
      }
    } catch (error) {
      console.error('[CheckoutSuccess] Error al obtener información del carrito:', error);
      // Continuar con el mensaje por defecto
    }
  }

  // Si hay un payment_id pero el status no es approved, mostrar mensaje de pago pendiente
  if (payment_id && (collection_status !== 'approved' || status !== 'approved')) {
    shippingMessage = 'Tu pago está siendo procesado. Te notificaremos cuando esté confirmado.';
  }

  return (
    <div className='min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-950/20 dark:via-background dark:to-green-950/20 px-4 py-20'>
      <div className='w-full max-w-2xl relative'>
        {/* Decoración de fondo */}
        <div className='absolute inset-0 -z-10 overflow-hidden rounded-2xl'>
          <div className='absolute -top-24 -right-24 w-96 h-96 bg-green-400/10 rounded-full blur-3xl' />
          <div className='absolute -bottom-24 -left-24 w-96 h-96 bg-green-500/10 rounded-full blur-3xl' />
        </div>

        {/* Card principal con animación */}
        <div className='relative bg-background border-2 border-green-200 dark:border-green-800 rounded-2xl shadow-2xl p-8 md:p-12 text-center animate-in fade-in-0 zoom-in-95 duration-500'>
          {/* Icono de éxito con animación */}
          <div className='relative inline-flex items-center justify-center mb-6'>
            <div className='absolute inset-0 rounded-full bg-green-500/20 animate-ping' />
            <div className='relative rounded-full bg-gradient-to-br from-green-500 to-green-600 p-6 shadow-lg transform transition-transform hover:scale-110'>
              <svg
                className='w-12 h-12 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={3}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
          </div>

          {/* Título principal */}
          <h1 className='text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-green-700 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent mb-4'>
            ¡Pago Exitoso!
          </h1>

          {/* Subtítulo */}
          <p className='text-xl md:text-2xl text-foreground/80 mb-2 font-medium'>
            Tu pago ha sido procesado correctamente
          </p>

          {/* Mensaje adicional */}
          <div className='my-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800'>
            <p className='text-base md:text-lg text-foreground/90 font-medium'>
              {shippingMessage}
            </p>
          </div>

          {/* Detalles del pago */}
          {payment_id && (
            <div className='mt-6 p-4 bg-muted/50 rounded-lg border border-border'>
              <p className='text-sm text-muted-foreground mb-1'>ID de transacción</p>
              <p className='text-base font-mono font-semibold text-foreground'>
                {payment_id}
              </p>
            </div>
          )}

          {/* Separador decorativo */}
          <div className='flex items-center justify-center my-8'>
            <div className='flex-1 border-t border-border' />
            <div className='px-4'>
              <div className='w-2 h-2 rounded-full bg-green-500' />
            </div>
            <div className='flex-1 border-t border-border' />
          </div>

          {/* Mensaje final */}
          <div className='space-y-2'>
            <p className='text-sm md:text-base text-muted-foreground'>
              Tu orden está siendo procesada y recibirás un correo electrónico con todos los detalles
            </p>
            <p className='text-sm text-muted-foreground'>
              Si tenés alguna pregunta, no dudes en contactarnos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
