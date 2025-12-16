'use server';

import { IPaymentFormData } from '@mercadopago/sdk-react/esm/bricks/payment/type';

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!;
const MEDUSA_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!;

interface ConfirmPaymentResponse {
  success: boolean;
  payment_session: {
    id: string;
    status: string;
  };
  error?: string;
  code?: string;
  message?: string;
}

export const confirmMercadopagoPayment = async (
  paymentSessionId: string,
  paymentData: IPaymentFormData['formData'],
): Promise<ConfirmPaymentResponse> => {
  if (!paymentSessionId) {
    throw new Error('Payment session ID is required');
  }

  if (!paymentData) {
    throw new Error('Payment data is required');
  }

  try {
    const res = await fetch(
      `${MEDUSA_BACKEND_URL}/store/mercadopago/payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          paymentSessionId,
          paymentData,
        }),
      },
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage =
        data.message ||
        data.error ||
        `Error ${res.status}: ${res.statusText}`;

      console.error('Error al confirmar el pago con Mercado Pago', {
        status: res.status,
        statusText: res.statusText,
        error: data,
        paymentSessionId,
      });

      throw new Error(errorMessage);
    }

    if (!data.success) {
      throw new Error(data.message || 'No se pudo confirmar el pago');
    }

    return data;
  } catch (error: any) {
    // Si el error ya tiene un mensaje, lo usamos
    if (error.message) {
      throw error;
    }

    // Si es un error de red u otro tipo, creamos un mensaje apropiado
    console.error('Error al confirmar el pago con Mercado Pago', {
      error,
      paymentSessionId,
    });

    throw new Error(
      error.message ||
        'No se pudo conectar con el servidor. Por favor, intentá nuevamente.'
    );
  }
};
