import { usePathname, useRouter } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { useTransition } from 'react';

export function useFilterParams() {
  const [isPending, startTransition] = useTransition();
  const path = usePathname();
  const router = useRouter();

  const [filters, setParams] = useQueryStates(
    {
      category: {
        defaultValue: '',
        parse: (value) => value || '',
      },
      page: {
        defaultValue: '1',
        parse: (value) => value || '1',
      },
      color: {
        defaultValue: '',
        parse: (value) => value || '',
      },
      size: {
        defaultValue: '',
        parse: (value) => value || '',
      },
      name: {
        defaultValue: '',
        parse: (value) => value || '',
      },
      order: {
        defaultValue: '',
        parse: (value) => value || '',
      },
      min_price: {
        defaultValue: '',
        parse: (value) => value || '',
      },
      max_price: {
        defaultValue: '',
        parse: (value) => value || '',
      },
    },
    {
      history: 'push',
      shallow: false,
      startTransition,
    },
  );

  const setCategory = (newCategory?: string) => {
    setParams({
      category: newCategory ? newCategory : null,
      page: '1',
    });
  };
  const setName = (newName: string) => {
    if (path.includes('/catalog')) {
      setParams({ name: newName, page: '1' });
    } else {
      router.push(`/catalog?name=${encodeURIComponent(newName)}&page=1`);
    }
  };
  const setPage = (newPage: string) => {
    setParams({ page: newPage });
  };
  const setOrder = (newSort: string) => {
    setParams({ order: newSort === undefined ? null : newSort });
  };
  const setColor = (newColor: string) => {
    setParams({ color: newColor === undefined ? null : newColor, page: '1' });
  };
  const setSize = (newSize?: string) => {
    setParams({ size: newSize ? newSize : null, page: '1' });
  };
  const setMinPrice = (minPrice: string) => {
    setParams({ min_price: minPrice === undefined ? null : minPrice, page: '1' });
  };
  const setMaxPrice = (maxPrice: string) => {
    setParams({ max_price: maxPrice === undefined ? null : maxPrice, page: '1' });
  };
  const cleanFilters = () => {
    setParams(null);
  };

  return {
    filters,
    isPending,
    cleanFilters,
    setCategory,
    setPage,
    setName,
    setOrder,
    setColor,
    setSize,
    setMinPrice,
    setMaxPrice,
  };
}
