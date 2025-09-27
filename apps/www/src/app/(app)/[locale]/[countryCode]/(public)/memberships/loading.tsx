import { Loader } from 'lucide-react';

export default function loading() {
  return (
    <section className='flex h-full items-center justify-center'>
      <Loader className='animate-spin' />
    </section>
  );
}
