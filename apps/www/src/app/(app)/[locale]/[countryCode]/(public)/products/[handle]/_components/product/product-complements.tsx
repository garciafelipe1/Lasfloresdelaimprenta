import { productService } from '@/services/product.service';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  productId: string;
}

export async function ProductComplements({ productId }: Props) {
  const complements = await productService.getComplements(productId);

  return (
    <div className='flex flex-col'>
      <h4>Complementos</h4>
      <ul className='grid grid-cols-2 gap-4'>
        {complements.map((c) => (
          <Link
            href={`/products/${c.handle}`}
            key={c.id}
            className='flex-col'
          >
            <div className='relative aspect-square w-full'>
              <Image
                className='h-full w-full rounded-md object-cover'
                src={c.thumbnail ?? ''}
                alt={c.title}
                fill
              />
            </div>
            <p className='m-0 text-sm'>{c.title}</p>
          </Link>
        ))}
      </ul>
    </div>
  );
}
