import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '@/app/components/common/section/section';
import { cartService } from '@/services/cart.service';
import { getTranslations } from 'next-intl/server';
import { CheckoutCart } from './_components/checkout-cart';
import { CheckoutEmpty } from './_components/checkout-empty';

export default async function CheckoutCartPage() {
  const t = await getTranslations('checkout');
  const cart = await cartService.getCart();

  const items = cart?.items ?? [];

  return (
    <div className='px-layout py-vertical'>
      <Section
        variant='page'
        size='desktop'
      >
        <SectionHeader>
          <SectionTitle>{t('cart.pageTitle')}</SectionTitle>
          <SectionSubtitle>
            {t('cart.pageSubtitle')}
          </SectionSubtitle>
        </SectionHeader>
        {items.length ? <CheckoutCart cart={cart!} /> : <CheckoutEmpty />}
      </Section>
    </div>
  );
}
