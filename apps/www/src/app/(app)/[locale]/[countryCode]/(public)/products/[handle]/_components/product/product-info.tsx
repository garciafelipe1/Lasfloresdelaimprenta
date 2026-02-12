import { getSafeImageUrl } from '@/lib/get-safe-image-url';
import { isComplement } from '@/lib/isComplement';
import { isExclusive } from '@/lib/isExclusive';
import { productService } from '@/services/product.service';
import { notFound } from 'next/navigation';
import { CommonQuestions } from '../common-questions';
import { Gallery } from '../gallery';
import { InteractiveSection } from '../interactive-section';
import { ProductBreadcrumb } from './product-breadcrumb';
import { ProductComplements } from './product-complements';
import { ExclusiveSection } from './product-exclusive-section';

interface Props {
  handle: string;
}

export async function ProductInfo({ handle }: Props) {
  const product = await productService.getByHandle(handle);

  if (!product) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? '';
  const rawUrls =
    (product.images?.length ? product.images.map((i) => i.url) : null) ??
    (product.thumbnail ? [product.thumbnail] : []);
  const images = rawUrls
    .map((url) => getSafeImageUrl(url, baseUrl || undefined, medusaUrl))
    .filter(Boolean);

  return (
    <div className='max-w-desktop mx-auto flex w-full flex-col gap-4'>
      <ProductBreadcrumb title={product.title} />
      <section className='grid w-full grid-cols-1 gap-4 md:grid-cols-[1fr_minmax(min(100%,200px),400px)]'>
        <Gallery images={images} />
        <aside>
          <div className='sticky top-20 flex flex-col gap-12'>
            <header>
              <h2>{product?.title}</h2>
              <div
                className='product-richtext-description prose dark:prose-invert'
                dangerouslySetInnerHTML={{ __html: product.description! }}
              />
            </header>
            {isExclusive(product.categories ?? []) ? (
              <ExclusiveSection handle={product.handle} />
            ) : (
              <InteractiveSection product={product} />
            )}

            {!isComplement(product.categories) && (
              <ProductComplements productId={product.id} />
            )}
            <CommonQuestions />
          </div>
        </aside>
      </section>
    </div>
  );
}
