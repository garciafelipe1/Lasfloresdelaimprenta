import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { orderService } from '@/services/order.service';
import { formatMoneyByLocale } from '@/lib/money-formatter';

type Props = {
  params: Promise<{ orderId: string }>;
};

function paymentStatusKey(status?: string) {
  switch (status) {
    case 'captured':
    case 'paid':
      return 'paid';
    case 'authorized':
      return 'authorized';
    case 'awaiting':
    case 'pending':
    case 'requires_more':
    case 'requires_action':
      return 'pending';
    case 'refunded':
    case 'partially_refunded':
      return 'refunded';
    case 'canceled':
    case 'cancelled':
      return 'canceled';
    default:
      return 'unknown';
  }
}

function fulfillmentStatusKey(status?: string) {
  switch (status) {
    case 'not_fulfilled':
      return 'not_fulfilled';
    case 'fulfilled':
    case 'partially_fulfilled':
      return 'fulfilled';
    case 'shipped':
      return 'shipped';
    case 'delivered':
      return 'delivered';
    case 'canceled':
    case 'cancelled':
      return 'canceled';
    default:
      return 'unknown';
  }
}

export default async function OrderDetailsPage({ params }: Props) {
  const t = await getTranslations();
  const locale = await getLocale();
  const { orderId } = await params;

  const order = await orderService.getMyOrder(orderId);

  if (!order) {
    notFound();
  }

  return (
    <section className='space-y-6'>
      <header className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl md:text-3xl font-bold'>
            {t('DashboardPage.orders.detailsTitle', { id: order.display_id ?? order.id })}
          </h1>
          <p className='mt-2 text-sm md:text-base text-muted-foreground'>
            {order.created_at
              ? new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(
                  new Date(order.created_at),
                )
              : ''}
          </p>
        </div>
        <Link
          href='/dashboard/orders'
          className='text-sm font-semibold text-primary underline underline-offset-4 hover:opacity-80'
        >
          {t('DashboardPage.orders.backToList')}
        </Link>
      </header>

      <section className='rounded-xl border border-border bg-secondary p-6'>
        <div className='flex flex-wrap gap-2'>
          {order.payment_status ? (
            <span className='rounded-full border border-border px-3 py-1 text-xs font-semibold'>
              {paymentStatusKey(String(order.payment_status)) === 'unknown'
                ? t('DashboardPage.orders.status.payment.unknown', {
                    status: String(order.payment_status),
                  })
                : t(
                    `DashboardPage.orders.status.payment.${paymentStatusKey(String(order.payment_status))}` as any,
                  )}
            </span>
          ) : null}
          {order.fulfillment_status ? (
            <span className='rounded-full border border-border px-3 py-1 text-xs font-semibold'>
              {fulfillmentStatusKey(String(order.fulfillment_status)) === 'unknown'
                ? t('DashboardPage.orders.status.fulfillment.unknown', {
                    status: String(order.fulfillment_status),
                  })
                : t(
                    `DashboardPage.orders.status.fulfillment.${fulfillmentStatusKey(String(order.fulfillment_status))}` as any,
                  )}
            </span>
          ) : null}
        </div>

        <div className='mt-6 space-y-4'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>{t('DashboardPage.orders.amounts.subtotal')}</p>
            <p className='font-semibold'>
              {typeof order.subtotal === 'number' ? formatMoneyByLocale(order.subtotal, locale) : ''}
            </p>
          </div>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>{t('DashboardPage.orders.amounts.shipping')}</p>
            <p className='font-semibold'>
              {typeof order.shipping_total === 'number'
                ? formatMoneyByLocale(order.shipping_total, locale)
                : ''}
            </p>
          </div>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>{t('DashboardPage.orders.amounts.total')}</p>
            <p className='text-lg font-semibold'>
              {typeof order.total === 'number' ? formatMoneyByLocale(order.total, locale) : ''}
            </p>
          </div>
        </div>
      </section>

      <section className='rounded-xl border border-border bg-secondary p-6'>
        <h2 className='text-lg font-semibold'>{t('DashboardPage.orders.itemsTitle')}</h2>
        <ul className='mt-4 space-y-3'>
          {(order.items ?? []).map((item: any) => (
            <li key={item.id} className='flex items-start justify-between gap-4 rounded-lg border border-border bg-background/40 p-4'>
              <div className='min-w-0'>
                <p className='font-semibold text-primary truncate'>{item.title}</p>
                <p className='text-sm text-muted-foreground'>
                  {t('DashboardPage.orders.itemQty', { qty: item.quantity ?? 0 })}
                </p>
              </div>
              <div className='text-right'>
                <p className='font-semibold'>
                  {typeof item.total === 'number' ? formatMoneyByLocale(item.total, locale) : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

