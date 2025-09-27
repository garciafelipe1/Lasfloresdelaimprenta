import { isExclusive } from '@/lib/isExclusive';
import { ProductDTO } from '@server/types';
import Image from 'next/image';
import Link from 'next/link';
import { formatARS } from 'utils';

interface Props {
  product: ProductDTO;
}

export const ProductCard = ({ product }: Props) => {
  let initialImage;
  let hoverImage;

  if (product.images?.length) {
    initialImage = product.images[0].url;
    hoverImage =
      product.images.length > 1 ? product.images[1].url : initialImage;
  }

  const productUrl = `/products/${product.handle}`;

  const lowestPrice = product.variants.reduce(
    (min, variant) =>
      Math.min(min, variant.calculated_price?.calculated_amount ?? Infinity),
    Infinity,
  );

  const currency = 'ARS';

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: initialImage,
    url: `https://api.nomeimporta.xyz${productUrl}`,
    brand: {
      '@type': 'Brand',
      name: 'Collection',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price: lowestPrice,
      itemCondition: 'https://schema.org/NewCondition',
      availability: 'https://schema.org/InStock', // O "OutOfStock"
      url: `https://api.nomeimporta.xyz${productUrl}`,
    },
  };

  return (
    <Link
      href={productUrl}
      className='group flex w-full cursor-pointer flex-col items-center justify-center gap-4'
    >
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <div className='relative aspect-[4/5] w-full overflow-hidden rounded-md'>
        {initialImage && (
          <Image
            draggable={false}
            className='absolute inset-0 h-full w-full object-cover opacity-100 transition-opacity duration-300 hover:opacity-0'
            alt={product.title + ' initial'}
            src={initialImage}
            fill
          />
        )}
        {hoverImage && (
          <Image
            draggable={false}
            className='absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 hover:opacity-100'
            alt={product.title + ' hover'}
            src={hoverImage}
            fill
          />
        )}
      </div>
      <div className='flex flex-col items-center justify-center *:text-center **:m-0'>
        <p className='text-sm font-semibold'>{product.title}</p>
        <p className='text-primary/50 text-sm font-semibold'>
          {isExclusive(product.categories ?? [])
            ? 'Consultar'
            : `Desde ${formatARS(lowestPrice)}`}
        </p>
      </div>
    </Link>
  );
};
