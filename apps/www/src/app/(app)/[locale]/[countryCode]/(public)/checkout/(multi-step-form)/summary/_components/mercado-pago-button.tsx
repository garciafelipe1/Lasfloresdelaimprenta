'use client';

import { confirmMercadopagoPayment } from '@/app/actions/checkout/confirm-mercado-pago-payment.action';
import { placeOrderAction } from '@/app/actions/checkout/place-order.action';
import { FormButton } from '@/app/components/ui/form-button';
import { useMercadopagoFormData } from '@/app/context/payment-form-provider';
import { StoreCart, StorePaymentSession } from '@medusajs/types';
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
      const msg =
        'Faltan datos de envío o facturación para completar el pedido.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (!session) {
      const msg = 'No se encontró la sesión de pago de Mercado Pago.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (!formData?.formData) {
      const msg =
        'Faltan los datos de la tarjeta. Volvé al paso de pago, completá el formulario y hacé clic en "Continuar".';
      setErrorMessage(msg);
      toast.error(msg);
      router.push('/checkout/payment', { scroll: false });
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

      toast.success('Pedido realizado correctamente ✅');
      router.refresh();
    } catch (err: any) {
      console.error('Error al procesar el pago', {
        error: err,
        sessionId: session.id,
      });

      // Mensajes de error más específicos
      let errorMessage =
        'No pudimos procesar el pago. Intentá nuevamente en unos minutos.';

      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.code === 'PAYMENT_SESSION_NOT_FOUND') {
        errorMessage =
          'La sesión de pago expiró. Por favor, volvé a seleccionar el método de pago.';
      } else if (err?.code === 'INVALID_PAYMENT_PROVIDER') {
        errorMessage =
          'Error en la configuración del método de pago. Por favor, intentá con otro método.';
      } else if (err?.code === 'UPDATE_SESSION_FAILED') {
        errorMessage =
          'No se pudieron guardar los datos de la tarjeta. Por favor, intentá nuevamente.';
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
        Realizar pedido
      </FormButton>
      <ErrorMessage error={errorMessage} />
    </>
  );
}
