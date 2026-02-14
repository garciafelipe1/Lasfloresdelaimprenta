import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '@/app/components/common/section/section';
import { InitiateCheckoutTracking } from '@/app/components/analytics/initiate-checkout-tracking';
import { cartService } from '@/services/cart.service';
import { getTranslations } from 'next-intl/server';
import { CheckoutCart } from './_components/checkout-cart';
import { CheckoutEmpty } from './_components/checkout-empty';

export default async function CheckoutCartPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const t = await getTranslations('checkout');
  const cart = await cartService.getCart();
  const params = await searchParams;
  const expired = params?.expired === '1';

  const items = cart?.items ?? [];

  return (
    <div className='px-4 py-6 sm:px-layout sm:py-vertical'>
      <InitiateCheckoutTracking />
      {expired && (
        <div className='bg-muted text-muted-foreground mb-4 rounded-lg border px-4 py-3 text-sm'>
          {t('cart.expiredMessage')}
        </div>
      )}
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
