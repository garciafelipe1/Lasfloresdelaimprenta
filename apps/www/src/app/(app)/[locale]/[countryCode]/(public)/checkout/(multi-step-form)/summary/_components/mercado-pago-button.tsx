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
      toast.error(
        'Faltan datos de envío o facturación para completar el pedido.',
      );
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

    // 2) Llamar backend: MP -> Medusa -> luego crear orden
    setSubmitting(true);
    setErrorMessage(null);

    try {
      // Confirma el pago en tu backend /store/mercadopago/payment
      await confirmMercadopagoPayment(session.id, formData.formData);

      // Crea la orden en Medusa
      await placeOrderAction();

      toast.success('Pedido realizado correctamente ✅');

      // Si tenés una página de éxito, podrías redirigir acá:
      // router.push('/checkout/success');
      router.refresh();
    } catch (err: any) {
      console.error('Error al confirmar el pago o crear la orden', err);
      const msg =
        err?.message ??
        'No pudimos confirmar el pago. Intentá nuevamente en unos minutos.';
      setErrorMessage(msg);
      toast.error(msg);
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
