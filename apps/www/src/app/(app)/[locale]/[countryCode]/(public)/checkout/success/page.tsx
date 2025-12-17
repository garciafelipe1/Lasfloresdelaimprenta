import { redirect } from 'next/navigation';
import { cookies } from '@/lib/data/cookies';
import { medusa } from '@/lib/medusa-client';

interface Props {
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
  const searchParams = await props.searchParams;
  const { external_reference, collection_status, payment_id, status } = searchParams;

  console.log('[CheckoutSuccess] Parámetros recibidos:', searchParams);

  // Si tenemos un external_reference (cart_id), intentar completar el carrito
  if (external_reference && collection_status === 'approved' && status === 'approved') {
    try {
      console.log('[CheckoutSuccess] Intentando completar carrito:', external_reference);
      
      // Completar el carrito para crear la orden
      const cartResponse = await medusa.store.cart.complete(external_reference);
      
      if (cartResponse.type === 'order') {
        console.log('[CheckoutSuccess] Orden creada exitosamente:', cartResponse.order.id);
        
        // Limpiar el carrito
        await cookies.removeCartId();
        
        // Redirigir a la página de confirmación de orden
        redirect(`/order/${cartResponse.order.display_id}/confirmed`);
      } else {
        console.warn('[CheckoutSuccess] El carrito no se pudo completar:', cartResponse);
      }
    } catch (error: any) {
      console.error('[CheckoutSuccess] Error al completar el carrito:', error);
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
        Te enviaremos un correo con los detalles de tu pedido. Si tenés alguna duda, no dudes en contactarnos.
      </p>
    </div>
  );
}

