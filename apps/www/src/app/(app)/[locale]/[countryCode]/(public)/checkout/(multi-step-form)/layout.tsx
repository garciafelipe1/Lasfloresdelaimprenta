import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '@/app/components/common/section/section';
import { InitiateCheckoutTracking } from '@/app/components/analytics/initiate-checkout-tracking';
import { MercadoPagoProvider } from '@/app/context/mercadopago-provider';
import { PaymentFormProvider } from '@/app/context/payment-form-provider';
import { PropsWithChildren } from 'react';
import { getTranslations } from 'next-intl/server';
import { CheckoutCartAside } from './_components/checkout-cart-aside';

export default async function Layout({ children }: PropsWithChildren) {
  const t = await getTranslations('checkout');
  const mercadoPagoKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

  return (
    <div className='px-layout py-vertical'>
      <InitiateCheckoutTracking />
      <Section
        variant='page'
        size='desktop'
      >
        <SectionHeader>
          <SectionTitle>{t('layout.title')}</SectionTitle>
          <SectionSubtitle>
            {t('layout.subtitle')}
          </SectionSubtitle>
        </SectionHeader>
        <div className='flex flex-col-reverse gap-8 lg:flex-row [&>:first-child]:flex-1'>
          <MercadoPagoProvider mercadopagoKey={mercadoPagoKey}>
            <PaymentFormProvider>
              <section className='flex flex-col gap-4'>{children}</section>
            </PaymentFormProvider>
          </MercadoPagoProvider>
          <CheckoutCartAside />
        </div>
      </Section>
    </div>
  );
}
