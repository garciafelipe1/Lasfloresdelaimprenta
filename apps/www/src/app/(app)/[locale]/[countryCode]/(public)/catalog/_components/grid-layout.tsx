'use client';

import { useIsMobile } from '@/app/hooks/use-mobile';
import { PropsWithChildren, ReactNode } from 'react';

interface Props extends PropsWithChildren {
  mobileFilter: ReactNode;
  desktopFilter: ReactNode;
}

export function GridLayout({ desktopFilter, mobileFilter, children }: Props) {
  const isMobile = useIsMobile();

  return (
    <section className='grid grid-cols-1 gap-8 lg:grid-cols-[min(100%,300px)_1fr]'>
      {isMobile ? mobileFilter : desktopFilter}
      {children}
    </section>
  );
}
