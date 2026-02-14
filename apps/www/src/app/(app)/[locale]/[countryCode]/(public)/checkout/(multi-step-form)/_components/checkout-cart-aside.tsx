import { cartService } from '@/services/cart.service';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { CartAmounts } from './cart-amounts';
import { CheckoutCartItems } from './checkout-cart-items';
import { PromoCodeForm } from './promo-code-form';

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

  const promotions = (cart as { promotions?: { code?: string; id?: string }[] }).promotions;
  
  // Calcular descuento: intentar obtener discount_total directamente, o calcularlo desde la diferencia
  let discountTotal: number | undefined = undefined;
  
  // Primero intentar obtener discount_total directamente
  const directDiscount = (cart as { discount_total?: number }).discount_total;
  if (typeof directDiscount === 'number' && directDiscount !== 0) {
    discountTotal = directDiscount;
  } else if (promotions && promotions.length > 0) {
    // Si hay promociones pero no discount_total, calcular la diferencia
    // El descuento sería: item_subtotal + shipping_total - total
    const itemSubtotal = cart.item_subtotal || 0;
    const shippingTotal = cart.shipping_total || 0;
    const total = cart.total || 0;
    const calculatedTotal = itemSubtotal + shippingTotal;
    
    // Si el total calculado es mayor que el total real, hay un descuento
    if (calculatedTotal > total) {
      discountTotal = calculatedTotal - total;
    }
  }

  return (
    <section className='relative rounded-xl'>
      <div className='sticky top-[calc(3rem+64px)] flex flex-col gap-4'>
        <header>
          <h2>{t('layout.asideTitle')}</h2>
        </header>
        <PromoCodeForm appliedPromotions={promotions} />
        <CartAmounts
          itemsTotal={cart.item_subtotal}
          shippingTotal={cart.shipping_total}
          total={cart.total}
          discountTotal={discountTotal}
          shippingDisplay={
            isShippingToConfirm ? t('shipping.shippingToConfirm.priceLabel') : undefined
          }
        />
        <CheckoutCartItems items={items} />
      </div>
    </section>
  );
}
