'use client';

import { Button } from '@/app/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/app/components/ui/sheet';
import { MenuIcon } from 'lucide-react';
import { useState } from 'react';

import { Links } from './links';
import { MobileThemedLogo } from './mobile-themed-logo';

export function MobileMenu() {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
    >
      <SheetTrigger asChild>
        <Button
          variant='outline'
          size='icon'
        >
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent
        side='left'
        className='flex flex-col space-y-4'
      >
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <MobileThemedLogo />
          </SheetTitle>
          <SheetDescription className='m-0'></SheetDescription>
        </SheetHeader>
        <Links onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
