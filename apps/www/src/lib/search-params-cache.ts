import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from 'nuqs/server';

export const filtersParams = {
  name: parseAsString.withDefault(''),
  order: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  category: parseAsString.withDefault(''),
};

export const searchParamsCache = createSearchParamsCache(filtersParams);

export type FilterParams = Awaited<
  ReturnType<(typeof searchParamsCache)['parse']>
>;
