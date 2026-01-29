import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { getTranslations } from 'next-intl/server';
import { AddressForm } from './_components/address-form';

export default async function CheckoutAddressStepPage() {
  const t = await getTranslations('checkout');
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('address.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm />
        </CardContent>
      </Card>
      <Card className='px-4'>
        <p className='m-0'>{t('steps.shipping')}</p>
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
