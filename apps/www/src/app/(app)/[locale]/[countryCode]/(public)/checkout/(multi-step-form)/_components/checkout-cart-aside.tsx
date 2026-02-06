import { cartService } from '@/services/cart.service';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { CartAmounts } from './cart-amounts';
import { CheckoutCartItems } from './checkout-cart-items';

export async function CheckoutCartAside() {
  const locale = await getLocale();
  const t = await getTranslations('checkout');
  const cart = await cartService.getCart();
  const items = cart?.items ?? [];

  if (!cart) {
    throw new Error('Cart not found');
  }

  if (!cart.items?.length) {
    redirect(`/${locale}/ar/catalog`);
  }

  const isShippingToConfirm = (() => {
    const meta = cart.metadata as unknown;
    if (!meta || typeof meta !== 'object') return false;
    return Boolean((meta as Record<string, unknown>).shipping_to_confirm);
  })();

  return (
    <section className='relative rounded-xl'>
      <div className='sticky top-[calc(3rem+64px)] flex flex-col gap-4'>
        <header>
          <h2>{t('layout.asideTitle')}</h2>
        </header>
        <CartAmounts
          itemsTotal={cart.item_subtotal}
          shippingTotal={cart.shipping_total}
          total={cart.total}
          shippingDisplay={
            isShippingToConfirm ? t('shipping.shippingToConfirm.priceLabel') : undefined
          }
        />
        <CheckoutCartItems items={items} />
      </div>
    </section>
  );
}
