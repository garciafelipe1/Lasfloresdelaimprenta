import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { cartService } from '@/services/cart.service';
import { getTranslations } from 'next-intl/server';
import { EditCard } from '../_components/edit-card';
import { ShippingForm } from './_components/shipping-form';

export default async function CheckoutShippingStepPage() {
  const t = await getTranslations('checkout');
  const response = await cartService.getShippingOptions();

  return (
    <>
      <EditCard stepSlug='address' />
      <Card>
        <CardHeader>
          <CardTitle>{t('shipping.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ShippingForm shippingMethodsAvailables={response} />
        </CardContent>
      </Card>
      <Card className='px-4'>
        <p className='m-0'>{t('steps.payment')}</p>
      </Card>
      <Card className='px-4'>
        <p className='m-0'>{t('steps.summary')}</p>
      </Card>
    </>
  );
}
