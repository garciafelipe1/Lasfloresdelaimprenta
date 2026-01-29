import { getTranslations } from 'next-intl/server';

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

export default async function CheckoutFailurePage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const t = await getTranslations('checkout');
  const basePath = `/${params.locale}/${params.countryCode}`;

  console.log('[CheckoutFailure] Parámetros recibidos:', searchParams);

  return (
    <div className='bg-secondary flex flex-col items-center justify-center border-b py-20 text-center'>
      <div className='text-background rounded-full bg-red-600 p-4'>
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
          <line x1='18' y1='6' x2='6' y2='18' />
          <line x1='6' y1='6' x2='18' y2='18' />
        </svg>
      </div>
      <h4 className='mt-4 text-xl font-semibold text-red-500'>{t('status.failure.title')}</h4>
      <p className='mt-2'>{t('status.failure.subtitle')}</p>
      {searchParams.payment_id && (
        <p className='mt-1 text-sm opacity-75'>
          {t('status.failure.paymentId', { id: searchParams.payment_id })}
        </p>
      )}
      <a
        href={`${basePath}/checkout/cart`}
        className='mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground'
      >
        {t('status.failure.back')}
      </a>
    </div>
  );
}

