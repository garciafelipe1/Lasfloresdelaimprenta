import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

export function EscencialIcon({ className }: ComponentProps<'svg'>) {
  return (
    <svg
      className={cn('size-12', className)}
      viewBox='0 0 48 48'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M24.0002 44C24.0002 32.9948 15.0052 24.0002 4 24.0002C15.0052 24.0002 24.0002 15.0052 24.0002 4C24.0002 15.0052 32.9948 24.0002 44 24.0002C32.9948 24.0002 24.0002 32.9948 24.0002 44Z'
        fill='currentColor'
      />
    </svg>
  );
}
