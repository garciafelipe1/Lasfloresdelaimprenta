'use client';

import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { useFilterParams } from '@/app/hooks/use-filter-params';
import { Loader, Search, X } from 'lucide-react';
import { ChangeEvent, FormEvent, useState } from 'react';
import { Input } from '../../../ui/input';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSearch({ open, onOpenChange }: Props) {
  const [search, setSearch] = useState<string>('');
  const { setName, isPending } = useFilterParams();

  const handleSubmit = (event: FormEvent) => {
    if (!search) return;
    event.preventDefault();
    setName(search);
    onOpenChange(false);
    setSearch('');
  };

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.startsWith(' ')) return;
    setSearch(event.target.value);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='max-w-full w-full h-full max-h-screen rounded-none border-0 p-0 gap-0 top-0 left-0 translate-x-0 translate-y-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100'>
        <DialogTitle className='sr-only'>Buscar productos</DialogTitle>
        <div className='flex flex-col h-screen w-full bg-background'>
          {/* Header del buscador */}
          <div className='flex items-center gap-4 border-b px-4 py-4'>
            <div className='relative flex-1'>
              <form
                onSubmit={handleSubmit}
                className='w-full'
              >
                <Input
                  className='rounded-full py-3 pr-12 pl-12 text-base'
                  onChange={handleOnChange}
                  placeholder='¿Qué estás buscando?'
                  value={search}
                  autoFocus
                />
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
                  {isPending ? (
                    <Loader className='text-primary/70 w-5 h-5 animate-spin' />
                  ) : (
                    <Search className='text-primary/70 w-5 h-5' />
                  )}
                </div>
                <button
                  hidden
                  type='submit'
                ></button>
              </form>
            </div>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => onOpenChange(false)}
            >
              <X className='h-5 w-5' />
              <span className='sr-only'>Cerrar</span>
            </Button>
          </div>

          {/* Contenido del buscador - puedes agregar resultados aquí */}
          <div className='flex-1 overflow-y-auto p-4'>
            {search && (
              <p className='text-sm text-muted-foreground'>
                Buscando: {search}
              </p>
            )}
            {!search && (
              <p className='text-sm text-muted-foreground text-center mt-8'>
                Escribe para buscar productos
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
