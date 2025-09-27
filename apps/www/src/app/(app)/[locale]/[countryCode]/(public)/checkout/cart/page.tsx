import {
  Section,
  SectionHeader,
  SectionSubtitle,
  SectionTitle,
} from '@/app/components/common/section/section';
import { cartService } from '@/services/cart.service';
import { CheckoutCart } from './_components/checkout-cart';
import { CheckoutEmpty } from './_components/checkout-empty';

export default async function CheckoutCartPage() {
  const cart = await cartService.getCart();

  const items = cart?.items ?? [];

  return (
    <div className='px-layout py-vertical'>
      <Section
        variant='page'
        size='desktop'
      >
        <SectionHeader>
          <SectionTitle>Carrito de compras</SectionTitle>
          <SectionSubtitle>
            Revisá los productos que elegiste antes de finalizar tu compra.
          </SectionSubtitle>
        </SectionHeader>
        {items.length ? <CheckoutCart cart={cart!} /> : <CheckoutEmpty />}
      </Section>
    </div>
  );
}
