'use client';

import { useIsMobile } from '@/app/hooks/use-mobile';
import { ReactElement } from 'react';

interface Props {
  Desktop: ReactElement;
  Mobile: ReactElement;
}

export function Header({ Desktop, Mobile }: Props) {
  const isMobile = useIsMobile();

  return (
    <header className='bg-background px-layout sticky top-0 right-0 left-0 z-50 w-full border-b will-change-transform backdrop-blur-sm bg-background/95'>
      {isMobile ? Mobile : Desktop}
    </header>
  );
}
