import {
  Section,
  SectionHeader,
  SectionTitle,
} from '@/app/components/common/section/section';
import { SearchTracking } from '@/app/components/analytics/search-tracking';
import { searchParamsCache } from '@/lib/search-params-cache';
import { SearchParams } from 'nuqs/server';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { CatalogWithContext } from './_components/catalog-with-context';
import { ProductsSkeleton } from './_components/products/product-skeleton';
import { ProductsList } from './_components/products/products-list';

interface Props {
  params: Promise<{ locale: string; countryCode: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale, countryCode } = await params;
  const filters = searchParamsCache.parse(await searchParams);
  const t = await getTranslations('categories-products.catalog');
  const searchQuery = filters?.name ?? undefined;

  return (
    <div className='px-layout'>
      <SearchTracking searchQuery={searchQuery} />
      <Section
        size='desktop'
        variant='page'
        className='gap-12 py-12'
      >
        <SectionHeader className='sr-only'>
          <SectionTitle>{t('title')}</SectionTitle>
        </SectionHeader>
        <CatalogWithContext>
          <Suspense fallback={<ProductsSkeleton />}>
            <ProductsList
              filters={filters}
              basePath={`/${locale}/${countryCode}/catalog`}
            />
          </Suspense>
        </CatalogWithContext>
      </Section>
    </div>
  );
}
