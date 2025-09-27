import { Button } from '@/components/ui/button';
import { ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';

export function CheckoutEmpty() {
  return (
    <div className='container mx-auto flex flex-col items-center justify-center py-20 text-center'>
      <ShoppingCartIcon className='text-muted-foreground mb-6 h-12 w-12' />
      <h2 className='mb-2 text-2xl font-semibold'>Tu carrito está vacío</h2>
      <p className='text-muted-foreground mb-6'>
        Parece que aún no agregaste productos. ¡Explorá nuestro catálogo!
      </p>
      <Button asChild>
        <Link href='/catalog'>Ver productos</Link>
      </Button>
    </div>
  );
}
