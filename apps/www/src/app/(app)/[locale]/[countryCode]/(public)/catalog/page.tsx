import {
  Section,
  SectionHeader,
  SectionTitle,
} from '@/app/components/common/section/section';
import { searchParamsCache } from '@/lib/search-params-cache';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { Filters } from './_components/filters/filters';
import { MobileFilters } from './_components/filters/mobile-filters';
import { GridLayout } from './_components/grid-layout';
import { ProductsSkeleton } from './_components/products/product-skeleton';
import { ProductsList } from './_components/products/products-list';

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function CatalogPage({ searchParams }: Props) {
  const filters = searchParamsCache.parse(await searchParams);

  return (
    <div className='px-layout'>
      <Section
        size='desktop'
        variant='page'
        className='gap-12 py-12'
      >
        <SectionHeader>
          <SectionTitle>Catálogo de productos</SectionTitle>
        </SectionHeader>
        <GridLayout
          desktopFilter={<Filters />}
          mobileFilter={<MobileFilters />}
        >
          <Suspense fallback={<ProductsSkeleton />}>
            <ProductsList filters={filters} />
          </Suspense>
        </GridLayout>
      </Section>
    </div>
  );
}
