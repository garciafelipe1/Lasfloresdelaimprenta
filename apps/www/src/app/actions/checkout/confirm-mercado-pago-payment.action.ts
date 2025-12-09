'use server';

import { IPaymentFormData } from '@mercadopago/sdk-react/esm/bricks/payment/type';

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!;
const MEDUSA_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!;

export const confirmMercadopagoPayment = async (
  paymentSessionId: string,
  paymentData: IPaymentFormData['formData'],
) => {
  console.log('ENVIANDO LA INFORMACION A MERCADO PAGO', {
    paymentSessionId,
  });

  try {
    const res = await fetch(
      `${MEDUSA_BACKEND_URL}/store/mercadopago/payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // si tu backend espera el publishable key:
          'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          paymentSessionId,
          paymentData,
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(
        'ERROR AL CREAR LA ORDEN EN MEDUSA',
        res.status,
        res.statusText,
        text,
      );
      throw new Error('No se pudo confirmar el pago con Mercado Pago');
    }

    const data = await res.json();
    console.log('PAGO MERCADO PAGO OK', data);

    return data;
  } catch (e) {
    console.error('ERROR AL CREAR LA ORDEN', e);
    throw e;
  }
};
