'use client';

import { confirmMercadopagoPayment } from '@/app/actions/checkout/confirm-mercado-pago-payment.action';
import { placeOrderAction } from '@/app/actions/checkout/place-order.action';
import { FormButton } from '@/app/components/ui/form-button';
import { useMercadopagoFormData } from '@/app/context/payment-form-provider';
import { StoreCart } from '@medusajs/types';
import { useState } from 'react';
import { ErrorMessage } from '../../_components/error-message';

export function MercadopagoPaymentButton({
  cart,
  notReady,
}: {
  cart: StoreCart;
  notReady: boolean;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onPaymentCompleted = async () => {
    await placeOrderAction()
      .catch((err) => {
        setErrorMessage(err.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const { formData } = useMercadopagoFormData();

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === 'pending',
  );

  const disabled = false;

  const handlePayment = async () => {
    setSubmitting(true);

    if (!cart || !session) {
      setSubmitting(false);
      return;
    }

    await confirmMercadopagoPayment(session.id, formData!.formData!);
    onPaymentCompleted();
  };

  return (
    <>
      <FormButton
        isLoading={submitting}
        disabled={disabled || notReady}
        onClick={handlePayment}
      >
        Realizar pedido
      </FormButton>
      <ErrorMessage error={errorMessage} />
    </>
  );
}
