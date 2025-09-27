import { Skeleton } from '@/app/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='px-layout py-vertical'>
      <div className='max-w-desktop mx-auto grid min-h-dvh w-full grid-cols-3 gap-8'>
        <Skeleton className='col-span-2 rounded-xl' />
        <Skeleton className='rounded-xl' />
      </div>
    </div>
  );
}
