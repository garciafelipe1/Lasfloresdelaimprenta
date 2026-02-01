import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { orderService } from '@/services/order.service';
import { formatMoneyByLocale } from '@/lib/money-formatter';

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

export default async function OrdersPage() {
  const t = await getTranslations();
  const locale = await getLocale();

  const res = await orderService.listMyOrders({ limit: 20, offset: 0 }).catch(() => null);
  const orders = res?.orders ?? [];

  return (
    <section className='space-y-6'>
      <header className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl md:text-3xl font-bold'>{t('DashboardPage.orders.pageTitle')}</h1>
          <p className='mt-2 text-sm md:text-base text-muted-foreground'>
            {t('DashboardPage.orders.pageSubtitle')}
          </p>
        </div>
        <Link
          href='/dashboard'
          className='text-sm font-semibold text-primary underline underline-offset-4 hover:opacity-80'
        >
          {t('DashboardPage.orders.backToDashboard')}
        </Link>
      </header>

      {orders.length === 0 ? (
        <section className='rounded-xl border border-border bg-secondary p-6'>
          <p className='text-primary'>{t('DashboardPage.orders.empty.title')}</p>
          <Link
            href='/catalog'
            className='mt-4 inline-flex rounded-lg bg-primary px-4 py-2 font-semibold text-secondary hover:bg-primary/80'
          >
            {t('DashboardPage.orders.empty.cta')}
          </Link>
        </section>
      ) : (
        <ul className='grid grid-cols-1 gap-4'>
          {orders.map((o: any) => (
            <li key={o.id} className='rounded-xl border border-border bg-secondary p-6'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div className='min-w-0'>
                  <h2 className='text-primary text-lg font-semibold'>
                    {t('DashboardPage.orders.orderLabel', { id: o.display_id ?? o.id })}
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    {o.created_at
                      ? new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(
                          new Date(o.created_at),
                        )
                      : ''}
                  </p>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {o.payment_status ? (
                      <span className='rounded-full border border-border px-3 py-1 text-xs font-semibold'>
                        {paymentStatusKey(String(o.payment_status)) === 'unknown'
                          ? t('DashboardPage.orders.status.payment.unknown', {
                              status: String(o.payment_status),
                            })
                          : t(
                              `DashboardPage.orders.status.payment.${paymentStatusKey(String(o.payment_status))}` as any,
                            )}
                      </span>
                    ) : null}
                    {o.fulfillment_status ? (
                      <span className='rounded-full border border-border px-3 py-1 text-xs font-semibold'>
                        {fulfillmentStatusKey(String(o.fulfillment_status)) === 'unknown'
                          ? t('DashboardPage.orders.status.fulfillment.unknown', {
                              status: String(o.fulfillment_status),
                            })
                          : t(
                              `DashboardPage.orders.status.fulfillment.${fulfillmentStatusKey(String(o.fulfillment_status))}` as any,
                            )}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className='text-left sm:text-right'>
                  <p className='text-primary text-lg font-semibold'>
                    {typeof o.total === 'number' ? formatMoneyByLocale(o.total, locale) : ''}
                  </p>
                  <Link
                    href={`/dashboard/orders/${o.id}`}
                    className='mt-2 inline-flex text-sm font-semibold text-primary underline underline-offset-4 hover:opacity-80'
                  >
                    {t('DashboardPage.orders.viewDetails')}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

