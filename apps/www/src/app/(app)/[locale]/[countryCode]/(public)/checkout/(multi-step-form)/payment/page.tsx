import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { cartService } from '@/services/cart.service';
import { paymentService } from '@/services/payment.service';
import { getTranslations } from 'next-intl/server';
import { EditCard } from '../_components/edit-card';
import { PaymentForms } from './_components/payment-forms';

export default async function CheckoutPaymentStepPage() {
  const t = await getTranslations('checkout');
  const cart = await cartService.getCart();
  const paymentMethods = await paymentService.listAvailablePaymentProviders({
    cart: cart!,
  });

  return (
    <>
      <EditCard stepSlug='address' />
      <EditCard stepSlug='shipping' />
      <Card>
        <CardHeader>
          <CardTitle>{t('payment.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentForms
            availablePaymentMethods={paymentMethods}
            cart={cart!}
          />
        </CardContent>
      </Card>
      <Card className='px-4'>
        <p className='m-0'>{t('steps.summary')}</p>
      </Card>
    </>
  );
}
