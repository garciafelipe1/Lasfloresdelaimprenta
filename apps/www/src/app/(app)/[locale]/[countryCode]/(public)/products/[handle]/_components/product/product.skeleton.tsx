import { Skeleton } from '@/app/components/ui/skeleton';

export function ProductSkeleton() {
  return (
    <div className='max-w-desktop mx-auto w-full'>
      <section className='grid min-h-[60dvh] w-full grid-cols-[1fr_minmax(min(100%,200px),400px)] gap-12'>
        <Skeleton />
        <aside className='flex flex-col gap-4'>
          <Skeleton className='h-20' />
          <div className='flex flex-col gap-2'>
            <Skeleton className='h-10' />
            <Skeleton className='h-10' />
            <Skeleton className='h-10' />
          </div>
        </aside>
      </section>
    </div>
  );
}
