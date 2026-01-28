import {
  Section,
  SectionHeader,
  SectionTitle,
} from '@/app/components/common/section/section';
import { searchParamsCache } from '@/lib/search-params-cache';
import { SearchParams } from 'nuqs/server';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { CatalogWithContext } from './_components/catalog-with-context';
import { ProductsSkeleton } from './_components/products/product-skeleton';
import { ProductsList } from './_components/products/products-list';

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function CatalogPage({ searchParams }: Props) {
  const filters = searchParamsCache.parse(await searchParams);
  const t = await getTranslations('categories-products.catalog');

  return (
    <div className='px-layout'>
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
            <ProductsList filters={filters} />
          </Suspense>
        </CatalogWithContext>
      </Section>
    </div>
  );
}
