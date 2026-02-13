'use client';

import { useIsMobile } from '@/app/hooks/use-mobile';
import { useMemo, useState } from 'react';
import { CatalogContextHeader } from './catalog-context-header';
import { Filters } from './filters/filters';
import { MobileFilters } from './filters/mobile-filters';
import { GridLayout } from './grid-layout';

const BANNER_SRC =
  'https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev/sanvalentinbanner.jpg';

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

      <div
        className='relative w-full bg-muted/30'
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          clipPath: 'inset(0 round 16px)',
          WebkitClipPath: 'inset(0 round 16px)',
        }}
      >
        <div
          className='relative w-full min-h-[240px] h-[min(380px,65vw)] sm:min-h-[300px] sm:h-[min(400px,55vw)] md:min-h-[360px] md:h-[min(480px,50vw)]'
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
            clipPath: 'inset(0 round 16px)',
            WebkitClipPath: 'inset(0 round 16px)',
          }}
        >
          <img
            src={BANNER_SRC}
            alt='Banner San Valentín - Las flores de la imprenta'
            className='absolute inset-0 h-full rounded-xl w-full object-contain object-center'
            style={{
              borderRadius: '16px',
              clipPath: 'inset(0 round 16px)',
              WebkitClipPath: 'inset(0 round 16px)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

