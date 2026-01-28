'use client';

import { useIsMobile } from '@/app/hooks/use-mobile';
import { useMemo, useState } from 'react';
import { CatalogContextHeader } from './catalog-context-header';
import { Filters } from './filters/filters';
import { MobileFilters } from './filters/mobile-filters';
import { GridLayout } from './grid-layout';

interface Props {
  children: React.ReactNode;
}

export function CatalogWithContext({ children }: Props) {
  const isMobile = useIsMobile();
  const [desktopFiltersVisible, setDesktopFiltersVisible] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtersOpen = isMobile ? mobileFiltersOpen : desktopFiltersVisible;
  const onToggleFilters = () => {
    if (isMobile) {
      setMobileFiltersOpen((v) => !v);
    } else {
      setDesktopFiltersVisible((v) => !v);
    }
  };

  const mobileFilterNode = useMemo(
    () => (
      <MobileFilters
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
      />
    ),
    [mobileFiltersOpen],
  );

  return (
    <div className='flex flex-col gap-6'>
      <CatalogContextHeader
        filtersOpen={filtersOpen}
        onToggleFilters={onToggleFilters}
      />

      <GridLayout
        showFilters={desktopFiltersVisible}
        desktopFilter={<Filters />}
        mobileFilter={mobileFilterNode}
      >
        {children}
      </GridLayout>
    </div>
  );
}

