import { getSafeImageUrl } from '@/lib/get-safe-image-url';
import { productService } from '@/services/product.service';
import { getTranslations, getLocale } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  productId: string;
}

export async function ProductComplements({ productId }: Props) {
  const locale = await getLocale();
  const t = await getTranslations('categories-products.products.complements');
  const complements = await productService.getComplements(productId);

  return (
    <div className='flex flex-col'>
      <h4>{t('title')}</h4>
      <ul className='grid grid-cols-2 gap-4'>
        {complements.map((c) => (
          <Link
            href={`/${locale}/ar/products/${c.handle}`}
            key={c.id}
            className='flex-col'
          >
            <div className='relative aspect-square w-full'>
              <Image
                className='h-full w-full rounded-md object-cover'
                src={getSafeImageUrl(c.thumbnail ?? '', undefined, process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? '')}
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
