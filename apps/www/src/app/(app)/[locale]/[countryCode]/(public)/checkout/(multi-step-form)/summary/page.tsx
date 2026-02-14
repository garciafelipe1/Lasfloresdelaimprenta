import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { cartService } from '@/services/cart.service';
import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { EditCard } from '../_components/edit-card';
import { CompleteOrderForm } from './_components/complete-order-form';
import { SummaryInfo } from './_components/summary-info';

export default async function CheckoutAddressStepPage() {
  const t = await getTranslations('checkout');
  const locale = await getLocale();
  const cart = await cartService.getCart();

  if (!cart) {
    redirect(`/${locale}/ar/checkout/cart?expired=1`);
  }

  return (
    <>
      <EditCard stepSlug='address' />
      <EditCard stepSlug='shipping' />
      <EditCard stepSlug='payment' />
      <Card>
        <CardHeader>
          <CardTitle>{t('summary.pageTitle')}</CardTitle>
          <CardDescription>
            {t('summary.pageDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-8'>
          <SummaryInfo cart={cart} />
          <CompleteOrderForm cart={cart} />
        </CardContent>
      </Card>
    </>
  );
}
