'use client';

import { useIsMobile } from '@/app/hooks/use-mobile';
import { PropsWithChildren, ReactNode } from 'react';

interface Props extends PropsWithChildren {
  mobileFilter: ReactNode;
  desktopFilter: ReactNode;
  showFilters?: boolean;
}

export function GridLayout({
  desktopFilter,
  mobileFilter,
  children,
  showFilters = true,
}: Props) {
  const isMobile = useIsMobile();

  return (
    <section
      className={
        showFilters
          ? 'grid grid-cols-1 gap-8 lg:grid-cols-[min(100%,300px)_1fr]'
          : 'grid grid-cols-1 gap-8'
      }
    >
      {isMobile ? mobileFilter : showFilters ? desktopFilter : null}
      {children}
    </section>
  );
}
