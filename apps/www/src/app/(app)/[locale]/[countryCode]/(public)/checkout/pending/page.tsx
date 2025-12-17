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

export default async function CheckoutPendingPage(props: Props) {
  const searchParams = await props.searchParams;

  console.log('[CheckoutPending] Parámetros recibidos:', searchParams);

  return (
    <div className='bg-secondary flex flex-col items-center justify-center border-b py-20 text-center'>
      <div className='text-background rounded-full bg-yellow-600 p-4'>
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
          <circle cx='12' cy='12' r='10' />
          <polyline points='12 6 12 12 16 14' />
        </svg>
      </div>
      <h4 className='mt-4 text-xl font-semibold text-yellow-500'>
        Pago pendiente
      </h4>
      <p className='mt-2'>
        Tu pago está siendo procesado. Te notificaremos cuando se complete.
      </p>
      {searchParams.payment_id && (
        <p className='mt-1 text-sm opacity-75'>
          ID de pago: {searchParams.payment_id}
        </p>
      )}
      <p className='mt-4 text-sm'>
        Te enviaremos un correo cuando el pago sea confirmado.
      </p>
    </div>
  );
}

