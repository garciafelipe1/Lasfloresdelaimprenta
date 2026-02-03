'use client';

import { Button } from '@/app/components/ui/button';
import { useFilterParams } from '@/app/hooks/use-filter-params';
import { CATEGORIES } from '@server/constants';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  filtersOpen: boolean;
  onToggleFilters: () => void;
}

type TFn = (key: string, values?: Record<string, unknown>) => string;

function getCategoryLabel(categoryValue: string, tFilters: TFn) {
  if (!categoryValue) return '';

  const match = Object.entries(CATEGORIES).find(([, value]) => value === categoryValue);
  if (!match) return categoryValue;

  const [key] = match;
  // @ts-expect-error - dynamic translation key
  return tFilters(`categoriesAccordion.options.${key}`);
}

export function CatalogContextHeader({ filtersOpen, onToggleFilters }: Props) {
  const tCatalog = useTranslations('categories-products.catalog');
  const tFilters = useTranslations('categories-products.filters');
  const tBar = useTranslations('categories-products.filters.contextBar');

  const {
    filters: { category, name },
  } = useFilterParams();

  const categoryLabel = getCategoryLabel(category, tFilters);

  const title = category
    ? categoryLabel
    : name
      ? tBar('resultsFor', { query: name })
      : tCatalog('title');

  const breadcrumbs = [
    tCatalog('breadcrumbs.home'),
    tCatalog('breadcrumbs.catalog'),
    category ? categoryLabel : name ? tBar('breadcrumbs.search') : null,
  ].filter(Boolean) as string[];

  return (
    <div className='flex flex-col gap-2'>
      <p className='text-sm text-muted-foreground'>
        {breadcrumbs.join(' / ')}
      </p>
      <p className='text-2xl font-semibold leading-tight text-primary'>{title}</p>

      <div className='flex items-center gap-3'>
        <Button
          type='button'
          variant='ghost'
          className='h-auto p-0 text-sm font-normal hover:bg-transparent'
          onClick={onToggleFilters}
        >
          {filtersOpen ? tBar('hideFilters') : tBar('showFilters')}
          <SlidersHorizontal className='ml-2 h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

