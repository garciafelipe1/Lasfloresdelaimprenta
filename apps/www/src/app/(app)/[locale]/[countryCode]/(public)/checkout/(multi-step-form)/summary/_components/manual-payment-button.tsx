'use client';

import { placeOrderAction } from '@/app/actions/checkout/place-order.action';
import { FormButton } from '@/app/components/ui/form-button';
import { useState } from 'react';
import { ErrorMessage } from '../../_components/error-message';

interface Props {
  notReady: boolean;
}

export function ManualPaymentButton({ notReady }: Props) {
  const [submitting, setSubmitting] = useState<boolean>(false);
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

  const handlePayment = () => {
    setSubmitting(true);
    onPaymentCompleted();
  };

  return (
    <>
      <FormButton
        disabled={notReady || submitting}
        isLoading={submitting}
        onClick={handlePayment}
        size='lg'
        data-testid='submit-order-button'
      >
        Realizar pedido
      </FormButton>
      <ErrorMessage
        error={errorMessage}
        data-testid='manual-payment-error-message'
      />
    </>
  );
}
