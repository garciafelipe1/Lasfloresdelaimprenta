'use client';

import {
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Pagination as ShadcnPagination,
} from '@/app/components/ui/pagination';

type Pagination = {
  totalPages: number;
  totalItems: number;
};

interface Props {
  currentPage: number;
  info: Pagination;
}

export function Pagination({ info, currentPage }: Props) {
  return (
    <ShadcnPagination>
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious href={`/catalog?page=${currentPage - 1}`} />
          </PaginationItem>
        )}

        {Array.from({ length: info.totalPages }, (_, index) => {
          const pageNumber = index + 1;
          const isCurrent = pageNumber === currentPage;

          return (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href={isCurrent ? '#' : `/catalog?page=${pageNumber}`}
                isActive={isCurrent}
                aria-disabled={isCurrent}
                className={isCurrent ? 'pointer-events-none opacity-50' : ''}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {/* <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem> */}
        {currentPage < info.totalPages && (
          <PaginationItem>
            <PaginationNext href={`/catalog?page=${currentPage + 1}`} />
          </PaginationItem>
        )}
      </PaginationContent>
    </ShadcnPagination>
  );
}
