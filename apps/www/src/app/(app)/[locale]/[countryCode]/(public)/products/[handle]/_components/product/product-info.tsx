import { getSafeImageUrl } from '@/lib/get-safe-image-url';
import { isComplement } from '@/lib/isComplement';
import { isExclusive } from '@/lib/isExclusive';
import { productService } from '@/services/product.service';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { CommonQuestions } from '../common-questions';
import { Gallery } from '../gallery';
import { InteractiveSection } from '../interactive-section';
import { ProductBreadcrumb } from './product-breadcrumb';
import { ProductComplements } from './product-complements';
import { ExclusiveSection } from './product-exclusive-section';

/** Títulos de productos Día de la Mujer que muestran la etiqueta "Producto limitado" en la página de detalle. */
const PRODUCTOS_LIMITADOS = new Set(
  [
    'Admiración Sutil',
    'Fuerza y Equilibrio',
    'Energía Creadora',
    'Reconocimiento Absoluto',
    'Mujer Líder',
    'Determinación Pura',
    'Elegancia y Gracia',
    'Box Vanguardia Femenina',
    'Esencia Inolvidable',
    'Edición Oro 8M',
    'Flower bag',
    'Bouquet spring en florero',
    'Box Esencia y Admiración',
  ].map((t) => t.trim().toLowerCase())
);
function isProductoLimitado(title: string | undefined) {
  return Boolean(title && PRODUCTOS_LIMITADOS.has(title.trim().toLowerCase()));
}

interface Props {
  handle: string;
}

export async function ProductInfo({ handle }: Props) {
  const [product, t] = await Promise.all([
    productService.getByHandle(handle),
    getTranslations('categories-products.products'),
  ]);

  if (!product) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const rawUrls =
    (product.images?.length ? product.images.map((i) => i.url) : null) ??
    (product.thumbnail ? [product.thumbnail] : []);
  const images = rawUrls
    .map((url) => getSafeImageUrl(url, baseUrl || undefined))
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
              {isProductoLimitado(product.title) ? (
                <span className='mt-2 inline-block rounded-md bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white'>
                  {t('productLimitedDetail')}
                </span>
              ) : null}
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
