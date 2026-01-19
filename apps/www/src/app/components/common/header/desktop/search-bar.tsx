'use client';

import { useFilterParams } from '@/app/hooks/use-filter-params';
import { Loader, Search } from 'lucide-react';
import { ChangeEvent, FormEvent, useState } from 'react';
import { Input } from '../../../ui/input';

export function SearchBar() {
  const [search, setSearch] = useState<string>('');
  const { setName, isPending } = useFilterParams();

  const handleSubmit = (event: FormEvent) => {
    if (!search) return;
    event.preventDefault();
    setName(search);
  };

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.startsWith(' ')) return;
    setSearch(event.target.value);
  };

  return (
    <div className='relative hidden items-center lg:flex'>
      <form onSubmit={handleSubmit}>
        <Input
          className='rounded-full py-2 pr-10 pl-4 text-sm'
          onChange={handleOnChange}
          placeholder='Buscar'
          value={search}
        />
        <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
          {isPending ? (
            <Loader className='text-primary/70 w-5 animate-spin' />
          ) : (
            <Search className='text-primary w-5' />
          )}
        </div>
        <button
          hidden
          type='submit'
        ></button>
      </form>
    </div>
  );
}
