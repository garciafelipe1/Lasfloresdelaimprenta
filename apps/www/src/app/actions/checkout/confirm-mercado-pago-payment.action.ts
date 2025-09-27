'use server';

import { medusa } from '@/lib/medusa-client';
import { IPaymentFormData } from '@mercadopago/sdk-react/esm/bricks/payment/type';
import { headers } from 'next/headers';

export const confirmMercadopagoPayment = async (
  paymentSessionId: string,
  paymentData: IPaymentFormData['formData'],
) => {
  console.log('ENVIANDO LA INFORMACION A MERCADO PAGO');

  return medusa.client
    .fetch('/store/mercadopago/payment', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: {
        paymentSessionId,
        paymentData,
      },
    })
    .then((res) => res)
    .catch((e) => {
      console.log('ERROR AL CREAR LA ORDEN');
      console.error({ e });
    });
};
