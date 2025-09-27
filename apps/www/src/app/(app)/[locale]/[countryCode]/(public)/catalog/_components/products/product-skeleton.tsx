import { Skeleton } from '@/app/components/ui/skeleton';

export function ProductsSkeleton() {
  return (
    <ul className='grid auto-rows-[300px] grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4'>
      {Array(10)
        .fill(1)
        .map((_, index) => (
          <Skeleton
            key={index}
            className='h-full w-full'
          />
        ))}
    </ul>
  );
}
