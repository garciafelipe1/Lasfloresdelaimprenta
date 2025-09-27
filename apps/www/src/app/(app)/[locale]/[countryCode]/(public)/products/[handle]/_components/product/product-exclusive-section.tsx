import { Button } from '@/app/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export function ExclusiveSection({ handle }: { handle: string }) {
  return (
    <section className='bg-secondary flex flex-col gap-4 rounded-lg p-6'>
      <h2 className='m-0 text-xl font-bold'>Diseños Exclusivos</h2>
      <p className='m-0'>
        Este producto es parte de nuestra colección exclusiva. Descubre más
        sobre nuestros diseños únicos y limitados.
      </p>
      <Link
        href={`/products/${handle}`}
        className='group w-full'
      >
        <Button className='w-full'>
          Consultar precios
          <ArrowUpRight className='transition group-hover:translate-x-[2px] group-hover:translate-y-[-2px]' />
        </Button>
      </Link>
    </section>
  );
}
