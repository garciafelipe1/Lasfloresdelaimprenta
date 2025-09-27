import { cartService } from '@/services/cart.service';
import { redirect } from 'next/navigation';
import { CartAmounts } from './cart-amounts';
import { CheckoutCartItems } from './checkout-cart-items';

export async function CheckoutCartAside() {
  const cart = await cartService.getCart();
  const items = cart?.items ?? [];

  if (!cart) {
    throw new Error('Cart not found');
  }

  if (!cart.items?.length) {
    redirect('/catalog');
  }

  return (
    <section className='relative rounded-xl'>
      <div className='sticky top-[calc(3rem+64px)] flex flex-col gap-4'>
        <header>
          <h2>En tu carrito</h2>
        </header>
        <CartAmounts
          itemsTotal={cart.item_subtotal}
          shippingTotal={cart.shipping_total}
          total={cart.total}
        />
        <CheckoutCartItems items={items} />
      </div>
    </section>
  );
}
