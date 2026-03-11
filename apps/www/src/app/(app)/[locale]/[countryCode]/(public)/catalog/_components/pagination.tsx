'use client';

import {
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Pagination as ShadcnPagination,
} from '@/app/components/ui/pagination';
import type { FilterParams } from '@/lib/search-params-cache';

type PaginationInfo = {
  totalPages: number;
  totalItems: number;
};

function buildCatalogQueryString(filters: FilterParams, page: number): string {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.name) params.set('name', filters.name);
  if (filters.order) params.set('order', filters.order);
  if (filters.size) params.set('size', filters.size);
  if (filters.color) params.set('color', filters.color);
  if (filters.min_price) params.set('min_price', filters.min_price);
  if (filters.max_price) params.set('max_price', filters.max_price);
  if (page > 1) params.set('page', String(page));
  return params.toString();
}

interface Props {
  currentPage: number;
  info: PaginationInfo;
  basePath: string;
  filters: FilterParams;
}

export function Pagination({ info, currentPage, basePath, filters }: Props) {
  const queryFor = (page: number) => buildCatalogQueryString(filters, page);

  return (
    <ShadcnPagination>
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious
              href={`${basePath}?${queryFor(currentPage - 1)}`}
            />
          </PaginationItem>
        )}

        {Array.from({ length: info.totalPages }, (_, index) => {
          const pageNumber = index + 1;
          const isCurrent = pageNumber === currentPage;
          const href = `${basePath}?${queryFor(pageNumber)}`;

          return (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href={isCurrent ? '#' : href}
                isActive={isCurrent}
                aria-disabled={isCurrent}
                className={isCurrent ? 'pointer-events-none opacity-50' : ''}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {currentPage < info.totalPages && (
          <PaginationItem>
            <PaginationNext
              href={`${basePath}?${queryFor(currentPage + 1)}`}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </ShadcnPagination>
  );
}
