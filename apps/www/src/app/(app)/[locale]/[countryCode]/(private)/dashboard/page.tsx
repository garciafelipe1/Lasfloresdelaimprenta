import Link from 'next/link';
import NewsSection from '@/app/components/NewSection';
import { getTranslations } from 'next-intl/server';
import { userService } from '@/services/user.service';
import { orderService } from '@/services/order.service';
import { getLocale } from 'next-intl/server';
import { formatMoneyByLocale } from '@/lib/money-formatter';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { getExclusiveGalleryImagesForMembership } from '@/lib/membership/exclusive-gallery';
import { BenefitsChecklist, type BenefitChecklistItem } from '@/app/components/dashboard/benefits-checklist';
import { authService } from '@/services/auth.service';
import { WELCOME_METADATA } from '@/lib/welcome/metadata-keys';

// Mapeo de IDs del backend a IDs del frontend
const membershipIdMap: Record<string, string> = {
  esencial: 'basico',
  premium: 'mediano',
  elite: 'premium',
};

export default async function DashboardPage() {
  const t = await getTranslations();
  const locale = await getLocale();

  const { subscription, innerCircle, referral } = await userService.getSubscriptionInfo();
  const me = await authService.getUser().catch(() => null);
  const meMeta = (me?.metadata && typeof me.metadata === 'object' && !Array.isArray(me.metadata))
    ? (me.metadata as Record<string, unknown>)
    : {};

  // Últimos pedidos del usuario (para preview en dashboard)
  const ordersRes = await orderService.listMyOrders({ limit: 3, offset: 0 }).catch(() => null);
  const latestOrders = ordersRes?.orders ?? [];
  const totalOrders = ordersRes?.count ?? latestOrders.length;

  // Mapear el ID de la membresía del backend al formato del frontend
  const userMembership = subscription?.membership?.id
    ? membershipIdMap[subscription.membership.id] || null
    : null;

  const hasMembership = Boolean(userMembership && subscription?.membership?.id);

  const monthsSinceInnerCircleStart = (() => {
    const raw = innerCircle?.memberSince;
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    const months =
      (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    return Math.max(0, months);
  })();

  // Progreso continuo: 0 meses = 0%, 12+ meses = 100%. (En UI marcamos hitos 1/6/12)
  const fidelizacionPercent =
    monthsSinceInnerCircleStart == null
      ? 0
      : Math.min(100, Math.round((monthsSinceInnerCircleStart / 12) * 100));

  const renderFidelizacion = () => {
    if (!innerCircle) return null;

    return (
      <div className="mb-5">
        <p className="text-primary text-lg font-semibold">Fidelización</p>

        <div className="mt-3">
          <div className="relative h-1 w-full rounded-full bg-border">
            <div
              className="absolute left-0 top-0 h-1 rounded-full bg-primary"
              style={{ width: `${fidelizacionPercent}%` }}
            />
            <div
              className="absolute -top-1.5 h-4 w-4 -translate-x-1/2 rounded-full border border-border bg-background shadow"
              style={{ left: `${fidelizacionPercent}%` }}
            />

            <div className="absolute -top-1.5 left-0 h-4 w-4 -translate-x-1/2 rounded-full bg-primary" />
            <div className="absolute -top-1.5 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-border" />
            <div className="absolute -top-1.5 left-full h-4 w-4 -translate-x-1/2 rounded-full bg-border" />
          </div>

          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>1 mes</span>
            <span>6 meses</span>
            <span>+12 meses</span>
          </div>

          <div className="mt-1 flex justify-between text-[11px] text-primary/80">
            <span>Sólido</span>
            <span>Senior</span>
            <span>VIP</span>
          </div>
        </div>
      </div>
    );
  };

  const membershipConfig: {
    [key: string]: {
      title: string;
      description: string;
      features: string[];
      bgColorClass: string;
      borderColorClass: string;
      accentColorClass: string;
    };
  } = {
    basico: {
      title: t('DashboardPage.membership.basico.title'),
      description: t('DashboardPage.membership.basico.description'),
      features: [
        t('DashboardPage.membership.basico.features.0'),
        t('DashboardPage.membership.basico.features.1'),
        t('DashboardPage.membership.basico.features.2'),
      ],
      bgColorClass: 'bg-secondary',
      borderColorClass: 'border-blue-400',
      accentColorClass: 'text-blue-600',
    },
    mediano: {
      title: t('DashboardPage.membership.mediano.title'),
      description: t('DashboardPage.membership.mediano.description'),
      features: [
        t('DashboardPage.membership.mediano.features.0'),
        t('DashboardPage.membership.mediano.features.1'),
        t('DashboardPage.membership.mediano.features.2'),
        t('DashboardPage.membership.mediano.features.3'),
      ],
      bgColorClass: 'bg-green-50',
      borderColorClass: 'border-green-400',
      accentColorClass: 'text-green-600',
    },
    premium: {
      title: t('DashboardPage.membership.premium.title'),
      description: t('DashboardPage.membership.premium.description'),
      features: [
        t('DashboardPage.membership.premium.features.0'),
        t('DashboardPage.membership.premium.features.1'),
        t('DashboardPage.membership.premium.features.2'),
        t('DashboardPage.membership.premium.features.3'),
      ],
      bgColorClass: 'bg-purple-50',
      borderColorClass: 'border-purple-400',
      accentColorClass: 'text-purple-600',
    },
  };

  const renderMembershipInfo = () => {

    if (!userMembership) {
      return (
        <div className='flex h-full flex-col items-center justify-center p-4 text-center'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='mb-4 h-12 w-12 text-yellow-500'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' />
            <line
              x1='12'
              y1='9'
              x2='12'
              y2='13'
            />
            <line
              x1='12'
              y1='17'
              x2='12.01'
              y2='17'
            />
          </svg>
          <p className='text-primary mb-4 text-xl font-semibold'>
            {t('DashboardPage.noMembership.title')}
          </p>
          <Link
            href='/memberships'
            className='bg-primary text-secondary hover:bg-primary/80 rounded-lg px-6 py-2 font-semibold transition-colors duration-200'
          >
            {t('DashboardPage.noMembership.explorePlansButton')}
          </Link>
        </div>
      );
    }

    const membership = membershipConfig[userMembership];

    if (!membership) {
      return (
        <div className='flex h-full flex-col items-center justify-center p-4 text-center'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='mb-4 h-12 w-12 text-red-500'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle
              cx='12'
              cy='12'
              r='10'
            />
            <line
              x1='12'
              y1='8'
              x2='12'
              y2='12'
            />
            <line
              x1='12'
              y1='16'
              x2='12.01'
              y2='16'
            />
          </svg>
          <p className='text-primary mb-4 text-xl font-semibold'>
            {t('DashboardPage.unknownMembership.title')}
          </p>
          <Link
            href='/soporte'
            className='bg-primary text-secondary hover:bg-primary/80 rounded-lg px-6 py-2 font-semibold transition-colors duration-200'
          >
            {t('DashboardPage.unknownMembership.supportButton')}
          </Link>
        </div>
      );
    }

    return (
      <div
        className={`rounded-xl border ${membership.borderColorClass} ${membership.bgColorClass} p-6 shadow-lg transition-all duration-300 hover:shadow-xl`}
      >
        <div className='flex items-center justify-between'>
          <h2 className='text-primary mb-3 text-3xl font-bold'>
            {membership.title}
          </h2>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className={`h-8 w-8 ${membership.accentColorClass}`}
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M4.5 16.5c-1.5 1.5-1.5 3.5 0 5s3.5 0 5-1.5L20.5 7.5c1.5-1.5 1.5-3.5 0-5s-3.5 0-5 1.5L4.5 16.5z' />
            <path d='M9 10L14 15' />
            <path d='M10 9L15 14' />
            <path d='M11 8L16 13' />
          </svg>
        </div>
        <p className='text-primary mb-6'>{membership.description}</p>

        <h3 className='text-primary mb-3 text-xl font-semibold'>
          {t('DashboardPage.membershipFeaturesTitle')}
        </h3>
        <ul className='text-primary space-y-2'>
          {membership.features.map((feature, index) => (
            <li
              key={index}
              className='flex items-center'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className={`mr-2 h-5 w-5 ${membership.accentColorClass}`}
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M20 6L9 17l-5-5' />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        {innerCircle && (
          <div
            className={`mt-6 rounded-lg border border-dashed p-4 ${membership.borderColorClass} bg-background/40`}
          >
            <p className='text-primary mb-1 text-xs font-semibold uppercase tracking-wide opacity-80'>
              Inner Circle
            </p>
            <p className={`text-primary mb-2 text-xl font-bold ${membership.accentColorClass}`}>
              {innerCircle.labelEs}
            </p>
            <p className='text-primary text-sm opacity-90'>
              {innerCircle.catalogDiscountPercent}% de descuento en el catálogo (no incluye membresías). Antigüedad
              desde{' '}
              {new Date(innerCircle.memberSince).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              .
            </p>
          </div>
        )}

        {referral && referral.ownCode && (
          <div
            className={`mt-4 rounded-lg border border-dashed p-4 ${membership.borderColorClass} bg-background/30`}
          >
            <p className='text-primary mb-1 text-xs font-semibold uppercase tracking-wide opacity-80'>
              Referidos
            </p>
            <p className='text-primary font-mono text-lg font-bold tracking-wide'>{referral.ownCode}</p>
            <p className='text-primary mt-1 text-xs opacity-80'>
              Compartí este código: quien se registre y compre membresía te ayuda a sumar recompensas en catálogo
              (tope mensual).
            </p>

            {(typeof referral.referredTotal === 'number' || typeof referral.rewardsGrantedThisMonth === 'number') && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {typeof referral.referredTotal === 'number' && (
                  <div className="rounded-lg border border-border bg-background/30 px-3 py-2">
                    <p className="text-primary text-xs font-semibold uppercase tracking-wide opacity-80">
                      Registrados con tu código
                    </p>
                    <p className="text-primary mt-1 text-base font-semibold">{referral.referredTotal}</p>
                  </div>
                )}
                {typeof referral.rewardsGrantedThisMonth === 'number' && (
                  <div className="rounded-lg border border-border bg-background/30 px-3 py-2">
                    <p className="text-primary text-xs font-semibold uppercase tracking-wide opacity-80">
                      Recompensas este mes
                    </p>
                    <p className="text-primary mt-1 text-base font-semibold">{referral.rewardsGrantedThisMonth}</p>
                  </div>
                )}
              </div>
            )}

            {Array.isArray(referral.recentReferees) && referral.recentReferees.length > 0 ? (
              <div className="mt-3">
                <p className="text-primary mb-2 text-xs font-semibold uppercase tracking-wide opacity-80">
                  Últimos referidos
                </p>
                <ul className="space-y-1">
                  {referral.recentReferees.slice(0, 5).map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-primary truncate">
                        {r.email ? r.email : `Customer ${r.id.slice(0, 8)}…`}
                      </span>
                      {r.createdAt ? (
                        <span className="text-muted-foreground whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                          })}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {referral && referral.daysUntilEligible != null && referral.daysUntilEligible > 0 && (
          <p className='text-primary mt-3 text-sm opacity-80'>
            Tu código de referidos estará disponible en {referral.daysUntilEligible} día
            {referral.daysUntilEligible === 1 ? '' : 's'}.
          </p>
        )}

        <div className='mt-8 text-right'>
          <button
            className={`bg-primary text-secondary hover:bg-primary/80 rounded-lg px-6 py-2 font-semibold transition-colors duration-200`}
          >
            {t('DashboardPage.manageMembershipButton')}
          </button>
        </div>
      </div>
    );
  };

  const exclusiveGallery = hasMembership
    ? getExclusiveGalleryImagesForMembership(subscription?.membership?.id, 6)
    : [];

  const welcomeCompleted = Boolean(meMeta[WELCOME_METADATA.profileCompletedAt]);
  const welcomeConsumed =
    meMeta[WELCOME_METADATA.promoConsumed] === true ||
    meMeta[WELCOME_METADATA.promoConsumed] === 'true';
  const welcomeUntilIso =
    typeof meMeta[WELCOME_METADATA.promoEligibleUntil] === 'string'
      ? (meMeta[WELCOME_METADATA.promoEligibleUntil] as string)
      : null;
  const welcomeUntilMs = welcomeUntilIso ? Date.parse(welcomeUntilIso) : NaN;
  const welcomeActive =
    welcomeCompleted &&
    !welcomeConsumed &&
    Number.isFinite(welcomeUntilMs) &&
    welcomeUntilMs > Date.now();

  const membershipBenefitItems: BenefitChecklistItem[] =
    hasMembership && userMembership && membershipConfig[userMembership]
      ? membershipConfig[userMembership].features.map((desc, idx) => ({
          id: `m-${idx}`,
          title: subscription?.membership?.name ?? 'Membresía',
          description: String(desc),
          active: true,
          expiresAt: null,
        }))
      : [];

  const benefitItems: BenefitChecklistItem[] = [
    ...(innerCircle
      ? [
          {
            id: 'inner-circle',
            title: 'Fidelización',
            description:
              innerCircle.tier === 'vip'
                ? 'Lead VIP: consultoría floral + Signature Box de regalo en aniversario.'
                : innerCircle.tier === 'senior'
                  ? 'Lead Senior: acceso anticipado + beneficio en decoración.'
                  : 'Lead Sólido: descuento en catálogo según antigüedad.',
            active: true,
            expiresAt: null,
          },
        ]
      : []),
    ...(welcomeActive
      ? [
          {
            id: 'welcome',
            title: 'Beneficio temporal',
            description: '10% de descuento en tu primera compra (catálogo).',
            active: true,
            expiresAt: welcomeUntilIso,
          },
        ]
      : []),
    ...(referral?.ownCode
      ? [
          {
            id: 'referral',
            title: 'Referidos',
            description: `Compartí tu código ${referral.ownCode} para desbloquear recompensas.`,
            active: true,
            expiresAt: null,
          },
        ]
      : []),
    ...membershipBenefitItems,
  ];

  return (
    <section className='container mx-auto px-4 py-8'>
      <div className='mb-10 text-center'>
        <h1 className='text-primary mb-2 text-4xl font-extrabold md:text-3xl'>
          {t('DashboardPage.welcomeTitle')}
        </h1>
        <p className='text-primary text-lg md:text-xl'>
          {t('DashboardPage.welcomeSubtitle')}
        </p>
      </div>

      {/* Fidelización: visible en desktop y mobile */}
      <div className="mb-6">
        {renderFidelizacion()}
      </div>

      {/* Mobile: panel por secciones (como en capturas) */}
      <div className="md:hidden">
        <Accordion
          type="single"
          collapsible
          defaultValue="beneficios"
          className="rounded-xl border border-border bg-secondary/30 px-4"
        >
          <AccordionItem value="beneficios">
            <AccordionTrigger className="text-primary text-2xl font-extrabold">
              Beneficios
            </AccordionTrigger>
            <AccordionContent>
              {benefitItems.length > 0 ? (
                <BenefitsChecklist items={benefitItems} />
              ) : (
                <div className="text-primary/80 text-sm">
                  Todavía no tenés beneficios activos.
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pedidos">
            <AccordionTrigger className="text-primary text-2xl font-extrabold">
              Mis pedidos
            </AccordionTrigger>
            <AccordionContent>
              {latestOrders.length === 0 ? (
                <div className="text-primary/80">
                  <p className="mb-4">{t('DashboardPage.orders.empty.title')}</p>
                  <Link
                    href="/catalog"
                    className="bg-primary text-secondary hover:bg-primary/80 inline-flex rounded-lg px-4 py-2 font-semibold transition-colors"
                  >
                    {t('DashboardPage.orders.empty.cta')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-primary/80">
                    {t('DashboardPage.orders.total', { count: totalOrders })}
                  </p>
                  <ul className="space-y-2">
                    {latestOrders.map((o: any) => (
                      <li key={o.id} className="rounded-lg border border-border bg-background/40 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-primary font-semibold truncate">
                              {t('DashboardPage.orders.orderLabel', { id: o.display_id ?? o.id })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {o.created_at
                                ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                                  new Date(o.created_at),
                                )
                                : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-primary font-semibold">
                              {typeof o.total === 'number'
                                ? formatMoneyByLocale(o.total, locale)
                                : ''}
                            </p>
                            <Link
                              href={`/dashboard/orders/${o.id}`}
                              className="text-xs font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                            >
                              {t('DashboardPage.orders.viewDetails')}
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4">
                <Link
                  href="/dashboard/orders"
                  className="text-sm font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                >
                  Ver todos los pedidos
                </Link>
              </div>
            </AccordionContent>
          </AccordionItem>

          {hasMembership && (
            <AccordionItem value="membresia">
              <AccordionTrigger className="text-primary text-2xl font-extrabold">
                Membresía
              </AccordionTrigger>
              <AccordionContent>
                {renderMembershipInfo()}
                {exclusiveGallery.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-border bg-background/20 p-4">
                    <p className="text-primary text-3xl font-extrabold tracking-wide">
                      exclusive gallery
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {exclusiveGallery.map((src) => (
                        <div
                          key={src}
                          className="overflow-hidden rounded-2xl bg-black/30"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/memberships/portfolio/${subscription?.membership?.id ?? ''}`}
                        className="text-primary text-sm font-semibold underline underline-offset-4 hover:opacity-80"
                      >
                        Ver portfolio completo
                      </Link>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>

      {/* Desktop/tablet: grilla actual */}
      <div className='hidden grid-cols-1 gap-6 md:grid md:grid-cols-2 lg:grid-cols-3'>
        <section className='bg-secondary col-span-1 rounded-xl p-6 shadow-md md:col-span-2'>
          <div className='mb-6 flex items-center justify-between'>
            <h2 className='text-primary text-2xl font-bold'>
              {t('DashboardPage.membershipSectionTitle')}
            </h2>
            <Link
              href='/'
              className='text-primary hover:text-primary/80 text-sm font-semibold underline underline-offset-4 transition-colors'
            >
              {t('DashboardPage.homeLink' as any) || 'Inicio'}
            </Link>
          </div>
          {renderMembershipInfo()}
        </section>

        {/* Mis pedidos (preview) */}
        <section className='bg-secondary col-span-1 rounded-xl p-6 shadow-md'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-primary text-2xl font-bold'>
              {t('DashboardPage.orders.sectionTitle')}
            </h2>
            <Link
              href='/dashboard/orders'
              className='text-sm font-semibold text-primary underline underline-offset-4 hover:opacity-80'
            >
              {t('DashboardPage.orders.viewAll')}
            </Link>
          </div>

          {latestOrders.length === 0 ? (
            <div className='text-primary/80'>
              <p className='mb-4'>{t('DashboardPage.orders.empty.title')}</p>
              <Link
                href='/catalog'
                className='bg-primary text-secondary hover:bg-primary/80 inline-flex rounded-lg px-4 py-2 font-semibold transition-colors'
              >
                {t('DashboardPage.orders.empty.cta')}
              </Link>
            </div>
          ) : (
            <div className='space-y-3'>
              <p className='text-sm text-primary/80'>
                {t('DashboardPage.orders.total', { count: totalOrders })}
              </p>
              <ul className='space-y-2'>
                {latestOrders.map((o: any) => (
                  <li key={o.id} className='rounded-lg border border-border bg-background/40 p-3'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='text-primary font-semibold truncate'>
                          {t('DashboardPage.orders.orderLabel', { id: o.display_id ?? o.id })}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {o.created_at
                            ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                              new Date(o.created_at),
                            )
                            : ''}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-primary font-semibold'>
                          {typeof o.total === 'number'
                            ? formatMoneyByLocale(o.total, locale)
                            : ''}
                        </p>
                        <Link
                          href={`/dashboard/orders/${o.id}`}
                          className='text-xs font-semibold text-primary underline underline-offset-4 hover:opacity-80'
                        >
                          {t('DashboardPage.orders.viewDetails')}
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <NewsSection />


      </div>
    </section>
  );
}
