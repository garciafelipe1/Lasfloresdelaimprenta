import { StoreCart } from '@medusajs/types';
import Image from 'next/image';
import { getSafeImageUrl } from '@/lib/get-safe-image-url';
import { formatMoneyByLocale } from '@/lib/money-formatter';
import { getLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { CartAmounts } from '../../_components/cart-amounts';

interface Props {
  cart: StoreCart;
}

export async function SummaryInfo({ cart }: Props) {
  const locale = await getLocale();
  const t = await getTranslations('checkout');
  const { last_name, first_name, city, province, phone, address_1 } =
    cart.shipping_address!;
  const deliveryDetails = (() => {
    const meta = cart.shipping_address?.metadata as unknown;
    if (!meta || typeof meta !== 'object') return '';
    return String((meta as Record<string, unknown>).delivery_details ?? '');
  })();

  const isShippingToConfirm = (() => {
    const meta = cart.metadata as unknown;
    if (!meta || typeof meta !== 'object') return false;
    return Boolean((meta as Record<string, unknown>).shipping_to_confirm);
  })();

  const { amount, name } = cart.shipping_methods![0]!;

  return (
    <div className='flex flex-col divide-y *:py-4 **:m-0'>
      <div className='flex flex-col gap-2'>
        <h4>{t('summary.shippingTitle')}</h4>
        <p>
          {first_name} {last_name}
        </p>
        <p className='opacity-50'>
          {province} - {city} - {address_1}
        </p>
        {deliveryDetails ? (
          <p className='opacity-50'>
            {t('address.fields.deliveryDetails')}: {deliveryDetails}
          </p>
        ) : null}
      </div>
      <div className='flex flex-col gap-2'>
        <h4>{t('summary.productsTitle')}</h4>
        <ul className='grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))]'>
          {cart.items?.map((item) => (
            <div
              key={item.id}
              className='bg-secondary flex flex-col gap-3 rounded-md p-3 shadow sm:flex-row sm:gap-4'
            >
              <div className='relative aspect-square h-20 w-20 flex-shrink-0'>
                <Image
                  alt=''
                  src={getSafeImageUrl(item.thumbnail ?? '')}
                  className='h-full w-full rounded-md object-cover'
                  fill
                />
              </div>
              <div className='flex min-w-0 flex-1 flex-col gap-1'>
                <h4 className='break-words text-sm font-semibold sm:text-base'>{item.title}</h4>
                <div className='flex flex-col gap-1 text-sm opacity-75'>
                  <p className='break-words'>
                    {t('summary.unitPrice')}: {formatMoneyByLocale(item.unit_price, locale)}
                  </p>
                  <p>{t('summary.units')}: {item.quantity}</p>
                  <p>{t('summary.subtotal')}: {formatMoneyByLocale(item.total, locale)}</p>
                </div>
                {item.metadata && item.metadata.message && (
                  <p className='break-words text-sm italic'>
                    &quot;{item.metadata.message as string}&quot;
                  </p>
                )}
              </div>
            </div>
          ))}
        </ul>
      </div>
      <div className='flex flex-col gap-2'>
        <h4>{t('summary.shippingMethodTitle')}</h4>
        <div>
          <span className='opacity-50'>{t('summary.method')}:</span> {name}
        </div>
        <div>
          <span className='opacity-50'>{t('summary.amount')}:</span>{' '}
          {isShippingToConfirm
            ? t('shipping.shippingToConfirm.priceLabel')
            : formatMoneyByLocale(amount, locale)}
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <h4>{t('summary.contactTitle')}</h4>
        <div>
          <span className='opacity-50'>{t('summary.email')}:</span> {cart.email}
        </div>
        <div>
          <span className='opacity-50'>{t('summary.phone')}:</span> {phone}
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <h4>{t('summary.orderSummaryTitle')}</h4>
        <CartAmounts
          itemsTotal={cart.item_subtotal}
          shippingTotal={cart.shipping_total}
          total={cart.total}
          discountTotal={(() => {
            // Calcular descuento: intentar obtener discount_total directamente, o calcularlo desde la diferencia
            const directDiscount = (cart as { discount_total?: number }).discount_total;
            if (typeof directDiscount === 'number' && directDiscount !== 0) {
              return directDiscount;
            }
            
            // Si hay promociones pero no discount_total, calcular la diferencia
            const promotions = (cart as { promotions?: { code?: string; id?: string }[] }).promotions;
            if (promotions && promotions.length > 0) {
              const itemSubtotal = cart.item_subtotal || 0;
              const shippingTotal = cart.shipping_total || 0;
              const total = cart.total || 0;
              const calculatedTotal = itemSubtotal + shippingTotal;
              
              // Si el total calculado es mayor que el total real, hay un descuento
              if (calculatedTotal > total) {
                return calculatedTotal - total;
              }
            }
            
            return undefined;
          })()}
          shippingDisplay={
            isShippingToConfirm ? t('shipping.shippingToConfirm.priceLabel') : undefined
          }
        />
      </div>
    </div>
  );
}
