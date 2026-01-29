import { Button } from '@/app/components/ui/button';
import { isManual, isMercadopago } from '../../payment/constants';
// import { useAction } from 'next-safe-action/hooks';
import { StoreCart } from '@medusajs/types';
import { getTranslations } from 'next-intl/server';
import { ManualPaymentButton } from './manual-payment-button';
import { MercadopagoPaymentButton } from './mercado-pago-button';

interface Props {
  cart: StoreCart;
}

export async function CompleteOrderForm({ cart }: Props) {
  const t = await getTranslations('checkout');
  const paymentSession = cart.payment_collection?.payment_sessions?.[0];
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1;

  console.log('Shipping Address:', Boolean(cart.shipping_address));
  console.log('Shipping Billing:', Boolean(cart.billing_address));
  console.log('Shipping Email:', Boolean(cart.email));
  console.log('Shipping Methods:', cart.shipping_methods?.length ?? 0);

  console.log(paymentSession?.provider_id);

  switch (true) {
    case isMercadopago(paymentSession?.provider_id):
      return (
        <MercadopagoPaymentButton
          notReady={notReady}
          cart={cart}
        />
      );
    case isManual(paymentSession?.provider_id):
      return <ManualPaymentButton notReady={notReady} />;
    default:
      return <Button disabled>{t('payment.methodError')}</Button>;
  }
}
