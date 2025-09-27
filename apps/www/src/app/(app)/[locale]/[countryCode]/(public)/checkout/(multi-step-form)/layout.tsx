import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '@/app/components/common/section/section';
import { MercadoPagoProvider } from '@/app/context/mercadopago-provider';
import { PaymentFormProvider } from '@/app/context/payment-form-provider';
import { PropsWithChildren } from 'react';
import { CheckoutCartAside } from './_components/checkout-cart-aside';

export default function Layout({ children }: PropsWithChildren) {
  const mercadoPagoKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

  return (
    <div className='px-layout py-vertical'>
      <Section
        variant='page'
        size='desktop'
      >
        <SectionHeader>
          <SectionTitle>Checkout</SectionTitle>
          <SectionSubtitle>
            Completá tu información de envío para que tu pedido llegue sin
            problemas.
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
