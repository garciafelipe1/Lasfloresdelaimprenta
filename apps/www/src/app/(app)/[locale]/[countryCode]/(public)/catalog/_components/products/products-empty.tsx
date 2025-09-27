import { Flower2 } from 'lucide-react';

export function ProductsEmpty() {
  return (
    <section className='flex h-full w-full items-center justify-center'>
      <div className='flex flex-col items-center gap-4 text-center'>
        <Flower2 className='h-12 w-12' />
        <h2 className='text-2xl font-semibold'>No hay productos</h2>
        <p className='text-muted-foreground'>
          No hemos encontrado productos que coincidan con tus criterios de
          búsqueda.
        </p>
      </div>
    </section>
  );
}
