import { Skeleton } from '@/app/components/ui/skeleton';

export function RecommendedProductsSkeleton() {
  return (
    <ul className='flex h-64 gap-2'>
      {Array(4)
        .fill(1)
        .map((n, index) => (
          <Skeleton
            key={index}
            className='rounded-md'
          />
        ))}
    </ul>
  );
}
