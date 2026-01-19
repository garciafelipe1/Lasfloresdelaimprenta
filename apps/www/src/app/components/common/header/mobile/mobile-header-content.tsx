'use client';

import { Button } from '@/components/ui/button';
import { StoreCart } from '@medusajs/types';
import { Search, UserCircleIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart } from '../../shopping-cart/shopping-cart';
import { MobileMenu } from './mobile-menu';
import { MobileSearch } from './mobile-search';
import { MobileThemedLogo } from './mobile-themed-logo';

interface Props {
  cart: StoreCart | null;
}

export function MobileHeaderContent({ cart }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className='flex items-center justify-between w-full'>
        <MobileThemedLogo />
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => setSearchOpen(true)}
          >
            <Search className='h-5 w-5 text-primary' />
            <span className='sr-only'>Buscar</span>
          </Button>
          <ShoppingCart cart={cart} />
          <Link href='/login'>
            <Button
              variant='outline'
              size='icon'
            >
              <UserCircleIcon className='h-5 w-5 text-primary' />
              <span className='sr-only'>Usuario</span>
            </Button>
          </Link>
          <MobileMenu />
        </div>
      </div>
      <MobileSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </>
  );
}
