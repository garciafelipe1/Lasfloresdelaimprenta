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
import { Filters } from './filters';

export function MobileFilters() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Filtros</Button>
      </SheetTrigger>
      <SheetContent className='flex flex-col space-y-4'>
        <SheetHeader className='sr-only'>
          <SheetTitle>Filtrar productos</SheetTitle>
          <SheetDescription className='m-0'>
            Aplica filtros para ajustar tu búsqueda
          </SheetDescription>
        </SheetHeader>
        <div className='pt-20'>
          <Filters />
        </div>
      </SheetContent>
    </Sheet>
  );
}
