'use client';

import { confirmMercadopagoPayment } from '@/app/actions/checkout/confirm-mercado-pago-payment.action';
import { placeOrderAction } from '@/app/actions/checkout/place-order.action';
import { FormButton } from '@/app/components/ui/form-button';
import { useMercadopagoFormData } from '@/app/context/payment-form-provider';
import { StoreCart, StorePaymentSession } from '@medusajs/types';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
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

  const locale = useLocale();
  const tFooter = useTranslations('footer');
  const t = useTranslations('checkout');
  const showCurrencyNote = locale === 'en';

  const { formData } = useMercadopagoFormData();
  const router = useRouter();

  // Buscamos la payment session de Mercado Pago
  const session: StorePaymentSession | undefined =
    cart.payment_collection?.payment_sessions?.find((s) =>
      s.provider_id?.startsWith('pp_mercadopago_'),
    ) ?? cart.payment_collection?.payment_sessions?.[0];

  const handlePayment = async () => {
    // 1) Validaciones previas
    if (notReady) {
      const msg = t('summary.mp.missingData');
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (!session) {
      const msg = t('summary.mp.missingSession');
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (!formData?.formData) {
      const msg = t('summary.mp.missingCard');
      setErrorMessage(msg);
      toast.error(msg);
      router.push(`/${locale}/ar/checkout/payment`, { scroll: false });
      return;
    }

    // 2) Procesar pago: actualizar sesión -> completar carrito
    setSubmitting(true);
    setErrorMessage(null);

    try {
      // Paso 1: Actualizar la sesión de pago con los datos de MercadoPago
      // Esto almacena los datos del formulario en la sesión para que el plugin
      // los use cuando se complete el carrito
      const paymentResult = await confirmMercadopagoPayment(
        session.id,
        formData.formData,
      );

      if (!paymentResult.success) {
        throw new Error(
          paymentResult.message || 'No se pudo actualizar la sesión de pago',
        );
      }

      // Paso 2: Completar el carrito
      // Esto crea la orden y automáticamente autoriza/captura el pago
      // usando el payment provider de MercadoPago con los datos almacenados
      await placeOrderAction();

      toast.success(t('summary.mp.successToast'));
      router.refresh();
    } catch (err: any) {
      console.error('Error al procesar el pago', {
        error: err,
        sessionId: session.id,
      });

      // Mensajes de error más específicos
      let errorMessage = t('summary.mp.processError');

      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.code === 'PAYMENT_SESSION_NOT_FOUND') {
        errorMessage = t('summary.mp.sessionExpired');
      } else if (err?.code === 'INVALID_PAYMENT_PROVIDER') {
        errorMessage = t('summary.mp.invalidProvider');
      } else if (err?.code === 'UPDATE_SESSION_FAILED') {
        errorMessage = t('summary.mp.updateSessionFailed');
      }

      setErrorMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <FormButton
        isLoading={submitting}
        disabled={notReady || submitting}
        onClick={handlePayment}
      >
        {t('summary.placeOrder')}
      </FormButton>
      {showCurrencyNote ? (
        <p className='mt-2 text-xs text-muted-foreground leading-snug'>
          {tFooter('currencyNote')}
        </p>
      ) : null}
      <ErrorMessage error={errorMessage} />
    </>
  );
}
