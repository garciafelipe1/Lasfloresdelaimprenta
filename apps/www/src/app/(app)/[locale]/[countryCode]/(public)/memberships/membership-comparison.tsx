'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MembershipId } from '@server/constants';
import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { membershipColors } from './constants';

const priceValues: Record<MembershipId, string> = {
  esencial: '$110.000',
  premium: '$185.000',
  elite: '$285.000',
};

const bouquetSizeValues: Record<MembershipId, string> = {
  esencial: 'S',
  premium: 'M',
  elite: 'XL',
};

function renderValue(
  value: string,
  feature: string,
  t: ReturnType<typeof useTranslations<'membership.comparison'>>
) {
  const noValue = t('features.fragrance.none');
  const noLabel = t('features.exclusiveProducts.no');
  const yesLabel = t('features.exclusiveProducts.yes');

  if (value === noValue || value === noLabel) {
    return (
      <div className='flex items-center justify-center'>
        <X className='h-4 w-4 text-red-500' />
      </div>
    );
  }

  if (value === yesLabel) {
    return (
      <div className='flex items-center justify-center'>
        <Check className='h-4 w-4 text-green-500' />
      </div>
    );
  }

  if (feature === 'bouquetSize') {
    return (
      <Badge
        variant='outline'
        className='font-semibold'
      >
        {value}
      </Badge>
    );
  }

  return <span className='text-sm'>{value}</span>;
}

const plans: MembershipId[] = ['esencial', 'premium', 'elite'];

const featureKeys = [
  'frequency',
  'bouquetSize',
  'flowerType',
  'candle',
  'fragrance',
  'vases',
  'loyaltyCard',
  'support',
  'exclusiveProducts',
  'customization',
  'idealFor',
  'price',
] as const;

export default function MembershipsComparison() {
  const params = useParams();
  const locale = params.locale as string;
  const countryCode = params.countryCode as string;
  const t = useTranslations('membership.comparison');

  const getPortfolioUrl = (plan: MembershipId) => {
    return `/${locale}/${countryCode}/memberships/portfolio/${plan}`;
  };

  const getPortfolioUrlWithForm = (plan: MembershipId) => {
    return `/${locale}/${countryCode}/memberships/portfolio/${plan}#obtener-membresia`;
  };

  const getFeatureValue = (featureKey: string, plan: MembershipId): string => {
    if (featureKey === 'price') {
      return priceValues[plan];
    }
    if (featureKey === 'bouquetSize') {
      return bouquetSizeValues[plan];
    }

    // Casos especiales que usan valores específicos
    if (featureKey === 'fragrance' && plan === 'esencial') {
      return t('features.fragrance.none');
    }
    if (featureKey === 'vases' && plan === 'esencial') {
      return t('features.vases.none');
    }
    if (featureKey === 'support' && plan === 'esencial') {
      return t('features.support.none');
    }
    if (featureKey === 'exclusiveProducts') {
      if (plan === 'esencial') {
        return t('features.exclusiveProducts.no');
      }
      return t('features.exclusiveProducts.yes');
    }
    if (featureKey === 'customization' && plan === 'esencial') {
      return t('features.customization.no');
    }

    // Casos normales: intentar acceder a la traducción directamente
    // @ts-expect-error - Dynamic translation key
    const translationKey = `features.${featureKey}.${plan}`;
    // @ts-expect-error - Dynamic translation key
    return t(translationKey);
  };

  const getFeatureLabel = (featureKey: string): string => {
    // @ts-expect-error - Dynamic translation key
    return t(`features.${featureKey}.label`);
  };

  return (
    <>
      {/* Desktop Table */}
      <div className='hidden lg:block'>
        <div className='overflow-hidden rounded-lg border'>
          <table className='w-full'>
            <thead>
              <tr className='bg-muted/50 border-b'>
                <th className='p-4 text-left font-semibold'>{t('characteristics')}</th>
                {plans.map((plan) => (
                  <th
                    key={plan}
                    className={`p-4 text-center ${membershipColors[plan].bg}`}
                  >
                    <Badge
                      className={`capitalize ${membershipColors[plan].accent}`}
                    >
                      {plan}
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureKeys.map((key, index) => (
                <tr
                  key={key}
                  className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  <td className='p-4 text-sm font-medium'>{getFeatureLabel(key)}</td>
                  {plans.map((plan) => (
                    <td
                      key={plan}
                      className='p-4 text-center'
                    >
                      {key === 'price' ? (
                        <div className='text-primary text-lg font-bold'>
                          {getFeatureValue(key, plan)}
                        </div>
                      ) : (
                        renderValue(getFeatureValue(key, plan), key, t)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className='border-b'>
                <td className='p-4'></td>
                {plans.map((plan) => (
                  <td
                    key={plan}
                    className='p-4 text-center space-y-2'
                  >
                    <Link
                      href={getPortfolioUrlWithForm(plan)}
                      className='block'
                    >
                      <Button
                        className={`w-full ${
                          plan === 'esencial'
                            ? 'bg-slate-600 hover:bg-slate-700'
                            : plan === 'premium'
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                      >
                        {t('choosePlan')}
                      </Button>
                    </Link>
                    <Link
                      href={getPortfolioUrl(plan)}
                      className='block'
                    >
                      <Button
                        variant='outline'
                        className='w-full'
                      >
                        {t('viewPortfolio')}
                      </Button>
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className='space-y-6 lg:hidden'>
        {plans.map((plan) => (
          <Card
            key={plan}
            className={`${membershipColors[plan].bg}`}
          >
            <CardHeader className='text-center'>
              <CardTitle className='flex items-center justify-center gap-2'>
                <Badge className={membershipColors[plan].accent}>{plan}</Badge>
              </CardTitle>
              <div className='text-primary text-2xl font-bold'>
                {getFeatureValue('price', plan)}
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {featureKeys.map((key) => {
                if (key === 'price') return null;
                return (
                  <div
                    key={key}
                    className='border-muted flex items-center justify-between border-b py-2'
                  >
                    <span className='text-muted-foreground text-sm font-medium'>
                      {getFeatureLabel(key)}
                    </span>
                    <div className='max-w-[60%] text-right'>
                      {renderValue(getFeatureValue(key, plan), key, t)}
                    </div>
                  </div>
                );
              })}
              <div className='mt-4 space-y-2 border-t pt-4'>
                <Link
                  href={getPortfolioUrlWithForm(plan)}
                  className='block'
                >
                  <Button
                    className={`w-full ${
                      plan === 'esencial'
                        ? 'bg-slate-600 hover:bg-slate-700'
                        : plan === 'premium'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {t('choosePlan')}
                  </Button>
                </Link>
                <Link
                  href={getPortfolioUrl(plan)}
                  className='block'
                >
                  <Button
                    variant='outline'
                    className='w-full'
                  >
                    {t('viewPortfolio')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
